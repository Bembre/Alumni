import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaIdCard } from 'react-icons/fa';
import api from '../services/api';
import Header from './Header';
import './CommonStyles.css';
import { toast } from 'react-hot-toast';

const AlumniRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    rollNumber: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name || !/^[A-Za-z ]+$/.test(formData.name)) {
        setError('Name is required and must only contain letters and spaces.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.email) {
        setError('Email is required.');
        setIsSubmitting(false);
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
        setError('Please enter a valid email address.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.rollNumber) {
        setError('Roll number is required.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.password) {
        setError('Password is required.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.confirmPassword) {
        setError('Please confirm your password.');
        setIsSubmitting(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        setIsSubmitting(false);
        return;
      }
      if (formData.password.length < 6 ||
          !/[A-Z]/.test(formData.password) ||
          !/[a-z]/.test(formData.password) ||
          !/[0-9]/.test(formData.password) ||
          !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        setError('Password must be at least 6 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
        setIsSubmitting(false);
        return;
      }

      // Submit registration
      const response = await api.post('/alumni/register', formData);
      
      if (response.data) {
        // Registration successful, redirect to login
        navigate('/auth', { state: { message: 'Registration successful! Please login.' } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="content">
        <h2>Alumni Registration</h2>
        {error && (
          <div className="alert alert-danger">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rollNumber">Roll Number *</label>
            <div className="input-group">
              <FaIdCard className="input-icon" />
              <input
                type="text"
                id="rollNumber"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlumniRegister; 