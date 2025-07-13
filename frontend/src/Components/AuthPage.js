import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserGraduate, FaUserTie, FaSignInAlt, FaUserPlus, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import mgmImg from "../img/mgm1.jpg";
import './CommonStyles.css';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosConfig';

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate form based on active tab
    if (activeTab === "login") {
      if (!loginForm.email || !loginForm.password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }
    } else if (activeTab === "register") {
      if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }
      if (registerForm.password !== registerForm.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (!isValidPassword(registerForm.password)) {
        setError("Password must be at least 6 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character.");
        setLoading(false);
        return;
      }
    }

    try {
      if (activeTab === "login") {
        // Determine role based on email domain
        let role;
        if (loginForm.email.endsWith('@mgmcen.ac.in')) {
          role = 'student';
        } else if (loginForm.email.endsWith('@gmail.com')) {
          role = 'alumni';
        } else {
          role = 'admin';
        }

        console.log('Attempting login with:', { email: loginForm.email, role });
        
        const response = await axiosInstance.post('/api/auth/login', {
          email: loginForm.email,
          password: loginForm.password,
          role: role
        });

        console.log('Login response:', response.data);
        const { token, role: userRole, user } = response.data;
        
        if (!token || !userRole || !user) {
          setError('Invalid response from server');
          setLoading(false);
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('user', JSON.stringify(user));

        if (userRole === 'student') {
          navigate('/sdash', { state: { email: loginForm.email } });
        } else if (userRole === 'admin') {
          navigate('/home', { state: { email: loginForm.email } });
        } else {
          navigate('/dashboard', { state: { email: loginForm.email } });
        }
      } else {
        // Handle registration
        console.log('Attempting registration with:', { email: registerForm.email, role: registerForm.role });
        
        const response = await axiosInstance.post('/api/auth/register', {
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role
        });

        console.log('Registration response:', response.data);
        setSuccess("Registration successful! Please login.");
        setActiveTab("login");
        setRegisterForm({
          email: "",
          password: "",
          confirmPassword: "",
          role: "student"
        });
      }
    } catch (err) {
      console.error(`${activeTab === 'login' ? 'Login' : 'Registration'} error:`, err);
      let errorMessage = `${activeTab === 'login' ? 'Login' : 'Registration'} failed. Please try again.`;
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.response?.status === 404) {
        errorMessage = `${activeTab === 'login' ? 'Login' : 'Registration'} endpoint not found. Please contact support.`;
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.message || 'Server error. Please try again later.';
      } else {
        errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'An unexpected error occurred.';
      }
      
      // Store error in localStorage for debugging
      localStorage.setItem('lastAuthError', JSON.stringify({
        type: activeTab,
        message: errorMessage,
        error: err,
        timestamp: new Date().toISOString()
      }));
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to check for previous errors
  useEffect(() => {
    const lastError = localStorage.getItem('lastAuthError');
    if (lastError) {
      try {
        const errorData = JSON.parse(lastError);
        const errorAge = new Date() - new Date(errorData.timestamp);
        // Show error if it's less than 5 minutes old
        if (errorAge < 5 * 60 * 1000) {
          setError(errorData.message);
          toast.error(errorData.message);
        }
        // Clear old errors
        localStorage.removeItem('lastAuthError');
      } catch (e) {
        console.error('Error parsing stored error:', e);
      }
    }
  }, []);

  // Forgot Password Handlers
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (forgotStep === 1) {
      // Send OTP
      try {
        await axiosInstance.post('/api/auth/forgot-password', { email: forgotEmail });
        setSuccess("OTP sent to your email");
        setForgotStep(2);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to send OTP");
      }
    } else if (forgotStep === 2) {
      // Verify OTP
      try {
        await axiosInstance.post('/api/auth/verify-otp', { email: forgotEmail, otp: forgotOTP });
        setSuccess("OTP verified. Please enter your new password.");
        setForgotStep(3);
      } catch (err) {
        setError(err.response?.data?.error || "Invalid OTP");
      }
    } else if (forgotStep === 3) {
      // Reset Password
      if (forgotNewPassword.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      try {
        await axiosInstance.post('/api/auth/reset-password', { 
          email: forgotEmail, 
          otp: forgotOTP, 
          newPassword: forgotNewPassword 
        });
        setSuccess("Password reset successful! Please login.");
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail(""); setForgotOTP(""); setForgotNewPassword("");
        setActiveTab("login");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to reset password");
      }
    }
  };

  // Add password validation function
  function isValidPassword(password) {
    // At least 1 special char, 1 uppercase, 1 lowercase, 1 number, min 6 chars
    return /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           password.length >= 6;
  }

  return (
    <div className="page-container">
      <div className="card" style={{ 
        maxWidth: '1000px', 
        margin: '2rem auto',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        minHeight: '600px'
      }}>
        <div style={{ flex: 1, position: 'relative', display: 'none' }} className="d-none d-md-block">
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img 
              src={mgmImg} 
              alt="MGM Campus" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }} 
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--primary-gradient)',
              opacity: 0.9,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--background-white)'
            }}>
              <h1 className="section-title" style={{ color: 'var(--background-white)', marginBottom: 'var(--spacing-lg)' }}>
                MGM Alumni Association
              </h1>
              <div className="section-divider"></div>
              <p style={{ fontSize: 'var(--font-size-lg)', opacity: 0.9 }}>
                Building Bridges Between Past and Future
              </p>
            </div>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          padding: 'var(--spacing-xxl)', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <div className="section-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 className="section-title">
                {activeTab === "login" ? "Welcome Back!" : "Join Our Network"}
              </h2>
              <div className="section-divider"></div>
              <p className="section-subtitle">
                {activeTab === "login" 
                  ? "Sign in to connect with the MGM community" 
                  : "Create your account to get started"
                }
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span>{success}</span>
              </div>
            )}

            <div className="d-flex gap-2" style={{ marginBottom: 'var(--spacing-xl)' }}>
              <button
                className={`btn ${activeTab === "login" ? 'btn-primary' : 'btn-secondary'} btn-lg auth-tab-button`}
                onClick={() => setActiveTab("login")}
                style={{ flex: 1, minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <FaSignInAlt />
                <span>Login</span>
              </button>
              <button
                className={`btn ${activeTab === "register" ? 'btn-primary' : 'btn-secondary'} btn-lg auth-tab-button`}
                onClick={() => setActiveTab("register")}
                style={{ flex: 1, minWidth: 120, borderRadius: '2em', boxShadow: '0 2px 8px rgba(26,42,108,0.10)', fontWeight: 600, transition: 'all 0.2s' }}
              >
                <FaUserPlus />
                <span>Register</span>
              </button>
            </div>

            {/* Forgot Password Flow */}
            {showForgot ? (
              <form onSubmit={handleForgotSubmit} className="mb-4 animate-section">
                {forgotStep === 1 && (
                  <>
                    <label className="form-label">Enter your registered email</label>
                    <input type="email" className="form-control mb-3" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                    <button className="btn btn-primary w-100 mb-2" type="submit">Send OTP</button>
                  </>
                )}
                {forgotStep === 2 && (
                  <>
                    <label className="form-label">Enter the OTP sent to your email</label>
                    <input type="text" className="form-control mb-3" value={forgotOTP} onChange={e => setForgotOTP(e.target.value)} required />
                    <button className="btn btn-primary w-100 mb-2" type="submit">Verify OTP</button>
                  </>
                )}
                {forgotStep === 3 && (
                  <>
                    <label className="form-label">Enter your new password</label>
                    <div className="input-group mb-3">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        className="form-control"
                        value={forgotNewPassword}
                        onChange={e => setForgotNewPassword(e.target.value)}
                        required
                      />
                      <span className="input-group-text" style={{ cursor: 'pointer' }} onClick={() => setShowForgotNewPassword(v => !v)}>
                        {showForgotNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    <button className="btn btn-success w-100 mb-2" type="submit">Reset Password</button>
                  </>
                )}
                <button type="button" className="btn btn-link w-100 mt-2" onClick={() => { setShowForgot(false); setForgotStep(1); setError(""); setSuccess(""); }}>Back to Login</button>
              </form>
            ) : (
              <>
                {activeTab === "login" && (
                  <form onSubmit={e => { e.preventDefault(); handleSubmit(e); }} className="mb-4 animate-section">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control mb-3"
                        name="email"
                        value={loginForm.email}
                        onChange={handleLoginChange}
                        required
                      />
                      <label className="form-label">Password</label>
                      <div className="input-group mb-3">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          className="form-control"
                          name="password"
                          value={loginForm.password}
                          onChange={handleLoginChange}
                          required
                        />
                        <span className="input-group-text" style={{ cursor: 'pointer' }} onClick={() => setShowLoginPassword(v => !v)}>
                          {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                      <button className="btn btn-primary w-100" type="submit">
                        <FaSignInAlt className="me-2" />Login
                      </button>
                    </div>
                    <button type="button" className="btn btn-link w-100" onClick={() => { setShowForgot(true); setError(""); setSuccess(""); }}>Forgot Password?</button>
                  </form>
                )}
                {activeTab === "register" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <div className="d-flex align-center">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaEnvelope />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={registerForm.email}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaLock />
                        </span>
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          name="password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Create a password"
                          required
                        />
                        <span className="input-group-text" style={{ cursor: 'pointer' }} onClick={() => setShowRegisterPassword(v => !v)}>
                          {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-primary" style={{ color: 'var(--background-white)' }}>
                          <FaLock />
                        </span>
                        <input
                          type={showRegisterConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterChange}
                          className="form-control"
                          placeholder="Confirm your password"
                          required
                        />
                        <span className="input-group-text" style={{ cursor: 'pointer' }} onClick={() => setShowRegisterConfirmPassword(v => !v)}>
                          {showRegisterConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <div className="d-flex gap-2">
                        <label className={`card ${registerForm.role === "student" ? 'btn-primary' : 'btn-secondary'}`} style={{
                          flex: 1,
                          padding: '1rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={registerForm.role === "student"}
                            onChange={handleRegisterChange}
                            style={{ display: 'none' }}
                          />
                          <FaUserGraduate className="mb-2" style={{ fontSize: '1.5rem' }} />
                          <div>Student</div>
                        </label>
                        <label className={`card ${registerForm.role === "alumni" ? 'btn-primary' : 'btn-secondary'}`} style={{
                          flex: 1,
                          padding: '1rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="radio"
                            name="role"
                            value="alumni"
                            checked={registerForm.role === "alumni"}
                            onChange={handleRegisterChange}
                            style={{ display: 'none' }}
                          />
                          <FaUserTie className="mb-2" style={{ fontSize: '1.5rem' }} />
                          <div>Alumni</div>
                        </label>
                      </div>
                    </div>

                    <button className="btn btn-primary w-100 mt-4" type="submit">
                      <FaUserPlus className="me-2" />Register
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 