import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosConfig";  // Import the configured axios instance
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaGraduationCap, FaBriefcase, FaSave, FaIdCard, FaTrash, FaPlus, FaTrophy, FaProjectDiagram, FaCode, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { profileService } from '../services/api';
import Header from './Header';

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    department: 'Information Technology',
    course: 'B. Tech. Information Technology',
    currentYear: '',
    studentId: '',
    phone: '',
    altPhone: '',
    currentAddress: '',
    permanentAddress: '',
    profilePic: null
  });

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'student') {
      navigate('/auth');
      return;
    }

    // Set email from user data first
    if (user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }

    // Check if we have profile data from navigation state
    if (location.state?.profileData) {
      const data = location.state.profileData;
      setFormData({
        firstName: data.first_name || '',
        middleName: data.middle_name || '',
        lastName: data.last_name || '',
        dob: data.dob || '',
        gender: data.gender || '',
        department: data.department || 'Information Technology',
        course: data.course || 'B. Tech. Information Technology',
        currentYear: data.current_year || '',
        studentId: data.student_id || '',
        phone: data.phone || '',
        altPhone: data.alt_phone || '',
        currentAddress: data.current_address || '',
        permanentAddress: data.permanent_address || '',
        profilePic: data.profile || null
      });
      setProfilePic(data.profile);
    } else {
      fetchUserData();
    }
  }, [navigate, location]);

  const currentYear = new Date().getFullYear();
  const maxDob = new Date(currentYear - 20, 0, 1).toISOString().split("T")[0];
  const minDob = "1997-01-01";

  // Validation helpers
  const isAlpha = str => /^[A-Za-z]+$/.test(str);
  const isPhone = str => /^\d{10}$/.test(str);
  const isStudentId = str => /^S\d{10}$/.test(str);
  const isPercentage = str => /^\d{1,2}(\.\d+)?$|^100(\.0+)?$/.test(str);
  const isMonth = n => Number.isInteger(+n) && +n >= 1 && +n <= 12;
  const isYear = y => /^\d{4}$/.test(String(y));
  const isNotFuture = date => new Date(date) <= new Date();

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);  // Set the image as base64
      reader.readAsDataURL(file);  // Read the file as data URL (base64 encoded)
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    // Name validation
    if (["firstName", "middleName", "lastName"].includes(name)) {
      if (value && !/^[A-Za-z]*$/.test(value)) return;
    }
    // Student ID validation
    if (name === "studentId") {
      if (!/^S\d{0,10}$/.test(value)) return;
    }
    // Phone validation
    if (["phone", "altPhone"].includes(name)) {
      if (!/^\d{0,10}$/.test(value)) return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Invalid authentication token. Please try logging in again.');
        return;
      }

      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('User not found. Please log in again.');
        return;
      }

      // Validation
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.phone || !formData.currentAddress) {
        toast.error('Please fill all required fields.');
        return;
      }

      const payload = {
        email: user.email, // Use user's email from localStorage
        department: formData.department,
        course: formData.course,
        first_name: formData.firstName,
        middle_name: formData.middleName || '',
        last_name: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        current_year: formData.currentYear,
        phone: formData.phone,
        alt_phone: formData.altPhone || '',
        student_id: formData.studentId || '',
        current_address: formData.currentAddress,
        permanent_address: formData.permanentAddress,
        profile: profilePic || null,
        profileCompleted: true // Mark profile as completed
      };

      console.log('Submitting student profile payload:', payload);
      const response = await axiosInstance.put('/api/student/profile', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        toast.success('Profile updated successfully!');
        // Update localStorage with new profile photo and completion status
        const updatedUser = { ...user, profileCompleted: true, profile: response.data.profile };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Redirect to home page after successful profile completion
        navigate('/home');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.');
    }
  };

  const handleAddSkill = () => {
    // This function is no longer needed as skills are removed
  };

  const handleAddProject = () => {
    // This function is no longer needed as projects are removed
  };

  const handleAddAchievement = () => {
    // This function is no longer needed as achievements are removed
  };

  const handleRemoveSkill = (index) => {
    // This function is no longer needed as skills are removed
  };

  const handleRemoveProject = (index) => {
    // This function is no longer needed as projects are removed
  };

  const handleRemoveAchievement = (index) => {
    // This function is no longer needed as achievements are removed
  };

  const handleSkillChange = (index, value) => {
    // This function is no longer needed as skills are removed
  };

  const handleProjectChange = (index, field, value) => {
    // This function is no longer needed as projects are removed
  };

  const handleAchievementChange = (index, field, value) => {
    // This function is no longer needed as achievements are removed
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Invalid authentication token. Please try logging in again.');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;
      
      const response = await axiosInstance.get('/api/student/profile');
      const data = response.data;
      
      // Ensure email is available from either source
      if (data.email) {
        setFormData(prev => ({ ...prev, email: data.email }));
      } else if (userEmail) {
        setFormData(prev => ({ ...prev, email: userEmail }));
      } else {
        toast.error('Email not found. Please try logging in again.');
        return;
      }
      
      // Check if this is a new user
      const isNewUser = !data.profileCompleted && (!data.experience || data.experience.length === 0);
      
      if (isNewUser) {
        // Initialize with empty data for new users
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          gender: '',
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          currentYear: '',
          studentId: '',
          phone: '',
          altPhone: '',
          currentAddress: '',
          permanentAddress: '',
          profilePic: null
        });
      } else {
        // Use existing data for returning users
        setFormData({
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
          lastName: data.last_name || '',
          dob: data.dob || '',
          gender: data.gender || '',
          department: 'Information Technology',
          course: 'B. Tech. Information Technology',
          currentYear: data.current_year || '',
          studentId: data.student_id || '',
          phone: data.phone || '',
          altPhone: data.alt_phone || '',
          currentAddress: data.current_address || '',
          permanentAddress: data.permanent_address || '',
          profilePic: data.profile || null
        });
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.');
    }
  };

  function validateProfile(data) {
    // DOB
    const dob = new Date(data.dob);
    // Education
    const edu10 = data.education?.find(e => e.type === '10th');
    const edu12 = data.education?.find(e => e.type === '12th');
    const grad = data.education?.find(e => e.type === 'Graduation');
    if (edu10 && isYear(edu10.year)) {
      if (dob.getFullYear() + 15 > +edu10.year) return '10th passing year must be at least 15 years after DOB';
    }
    if (edu12 && edu10 && isYear(edu12.year) && isYear(edu10.year)) {
      if (+edu10.year + 2 > +edu12.year) return '12th passing year must be at least 2 years after 10th';
    }
    if (grad && edu12 && isYear(grad.year) && isYear(edu12.year)) {
      if (+edu12.year + 4 > +grad.year) return 'Graduation passing year must be at least 4 years after 12th';
    }
    // Achievements
    if (Array.isArray(data.achievements)) {
      for (const ach of data.achievements) {
        if (ach.date && (!isNotFuture(ach.date) || new Date(ach.date) < dob)) return 'Achievement date must not be in the future and after DOB';
      }
    }
    // Experience/Projects
    if (Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        if (exp.months && !isMonth(exp.months)) return 'Experience months must be between 1 and 12';
      }
    }
    if (Array.isArray(data.projects)) {
      for (const proj of data.projects) {
        if (proj.months && !isMonth(proj.months)) return 'Project months must be between 1 and 12';
      }
    }
    // Percentage
    if (Array.isArray(data.education)) {
      for (const edu of data.education) {
        if (edu.percentage && (!isPercentage(edu.percentage) || +edu.percentage > 100 || +edu.percentage < 0)) return 'Percentage must be between 0 and 100';
      }
    }
    // Phone
    if (data.phone && !isPhone(data.phone)) return 'Phone must be 10 digits';
    if (data.alt_phone && !isPhone(data.alt_phone)) return 'Alternate phone must be 10 digits';
    return null;
  }

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="card shadow-lg p-4 rounded-4">
          <div className="text-center mb-4">
            <h2 className="text-primary fw-bold">
              <FaUser className="me-2" />
              Student Dashboard
            </h2>
            <p className="text-muted">Complete your profile to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Profile Photo Section */}
            <div className="mb-4 text-center">
              <div className="position-relative d-inline-block">
                <div
                  className="rounded-circle overflow-hidden"
                  style={{
                    width: "150px",
                    height: "150px",
                    border: "3px solid #0d6efd",
                    margin: "auto",
                  }}
                >
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile"
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                      <FaUser size={50} className="text-muted" />
                    </div>
                  )}
                </div>
                <label
                  className="btn btn-primary rounded-circle position-absolute bottom-0 end-0"
                  style={{ width: "40px", height: "40px" }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="d-none"
                  />
                  <FaUser className="m-0" />
                </label>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Personal Information</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="dob"
                      value={formData.dob}
                      onChange={handleFieldChange}
                      min={minDob}
                      max={maxDob}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Gender *</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={formData.gender}
                      onChange={handleFieldChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <FaGraduationCap className="me-2" />
                  Academic Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      className="form-control"
                      value="Information Technology"
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Course *</label>
                    <input
                      type="text"
                      className="form-control"
                      value="B. Tech. Information Technology"
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Current Year *</label>
                    <select
                      name="currentYear"
                      className="form-select"
                      value={formData.currentYear}
                      onChange={handleFieldChange}
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Student ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="studentId"
                      value={formData.studentId || 'S'}
                      onChange={handleFieldChange}
                      maxLength={11}
                      required
                      pattern="^S\d{10}$"
                      title="Student ID must start with S and be followed by 10 digits."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <FaIdCard className="me-2" />
                  Contact Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFieldChange}
                      maxLength={10}
                      required
                      pattern="\d{10}"
                      title="Phone must be 10 digits."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Alternate Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      name="altPhone"
                      value={formData.altPhone}
                      onChange={handleFieldChange}
                      maxLength={10}
                      pattern="\d{10}"
                      title="Alternate Phone must be 10 digits."
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Current Address *</label>
                    <textarea
                      className="form-control"
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleFieldChange}
                      rows="3"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Permanent Address *</label>
                    <textarea
                      className="form-control"
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleFieldChange}
                      rows="3"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button type="submit" className="btn btn-primary btn-lg w-100" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}>
                <FaSave className="me-2" />
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
