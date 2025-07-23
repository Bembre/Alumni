import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaSave, FaIdCard, FaTrash, FaPlus, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding, FaEdit, FaProjectDiagram, FaTrophy } from 'react-icons/fa';
import Header from './Header';
import './CommonStyles.css';
import { toast } from 'react-hot-toast';
import { alumniService, uploadService } from '../services/api';

const AlumniProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [globalEdit, setGlobalEdit] = useState(false);
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) {
      navigate('/auth');
      return;
    }
    setCurrentUser(user);
    fetchProfile();
  }, [id, navigate]);

  const fetchProfile = async () => {
    try {
      const profile = await alumniService.getProfile();
      setProfileData(profile);
      setLoading(false);
      if (profile) setFormData(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      let errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper validation functions
  const isAlpha = str => !str || /^[A-Za-z]+$/.test(str);
  const isPhone = str => !str || /^\d{10}$/.test(str);
  const validAchievementTypes = ['sports', 'awards', 'academic', 'events'];
  const validEducationTypes = ['10th', '12th', 'Graduation', 'Post Graduation', ''];

  function validateAlumniProfile(formData) {
    if (!isAlpha(formData.first_name)) return 'First name must contain only letters.';
    if (!isAlpha(formData.middle_name)) return 'Middle name must contain only letters.';
    if (!isAlpha(formData.last_name)) return 'Last name must contain only letters.';
    if (!isPhone(formData.phone)) return 'Phone must be 10 digits.';
    if (!isPhone(formData.alt_phone)) return 'Alternate phone must be 10 digits.';
    if (Array.isArray(formData.achievements)) {
      for (const ach of formData.achievements) {
        if (ach.type && !validAchievementTypes.includes(ach.type)) {
          return `Achievement type '${ach.type}' is not allowed.`;
        }
      }
    }
    if (Array.isArray(formData.education)) {
      for (const edu of formData.education) {
        if (edu.type && !validEducationTypes.includes(edu.type)) {
          return `Education type '${edu.type}' is not allowed.`;
        }
      }
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const validationError = validateAlumniProfile(formData);
    if (validationError) {
      toast.error(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        profileCompleted: true
      };
      const response = await alumniService.updateProfile(payload);
      
      if (response) {
        setProfileData(response);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Update local storage with new profile data
        const user = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...user, ...response, profileCompleted: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGlobalEdit = () => {
    setGlobalEdit(true);
    setEditSection('all');
  };
  const handleGlobalSave = async () => {
    setError('');
    setSuccess('');
    const validationError = validateAlumniProfile(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Construct payload with correct backend field names
      const payload = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        department: formData.department,
        course: formData.course,
        passing_year: formData.passing_year,
        current_company: formData.current_company,
        designation: formData.designation,
        current_location: formData.current_location,
        joined_date: formData.joined_date,
        phone: formData.phone,
        alt_phone: formData.alt_phone,
        current_address: formData.current_address,
        permanent_address: formData.permanent_address,
        profile: formData.profile,
        experience: formData.experience,
        skillset: formData.skillset,
        projects: formData.projects,
        achievements: formData.achievements,
        education: formData.education,
        profileCompleted: true
      };
      const response = await alumniService.updateProfile(payload);
      if (response) {
        setProfileData(response);
        setGlobalEdit(false);
        setSuccess('Profile updated successfully!');
        // Update localStorage with new profile data
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          const updatedUser = { ...user, ...response, profileCompleted: true };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };
  const handleGlobalCancel = () => {
    setGlobalEdit(false);
    setEditSection(null);
    setFormData(profileData);
  };

  const handleArrayChange = (section, idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === idx ? (field ? { ...item, [field]: value } : value) : item
      )
    }));
  };
  const handleArrayAdd = (section, template) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), template]
    }));
  };
  const handleArrayRemove = (section, idx) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== idx)
    }));
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Image size should be less than 2MB');
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }

        // Upload file and get URLs
        const urls = await uploadService.uploadProfilePhoto(file);
        
        // Update form with GitHub URL
        setFormData(prev => ({ ...prev, profile: urls.githubUrl }));
        toast.success('Profile photo uploaded successfully!');
      } catch (err) {
        console.error('Error uploading profile photo:', err);
        toast.error('Error uploading profile photo. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="profile-container">
          <div className="profile-message profile-message-error">
            <h4>Error</h4>
            <p>{error}</p>
            <button className="profile-edit-button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <Header />
        <div className="profile-container">
          <div className="profile-message profile-message-error">
            <h4>Profile Not Found</h4>
            <p>The requested profile could not be found.</p>
            <button className="profile-edit-button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Academic Section Template
  const academicFields = [
    { label: 'Department', name: 'department' },
    { label: 'Course', name: 'course' },
    { label: 'Passing Year', name: 'passing_year', type: 'number' }
  ];
  // Professional Section Template
  const professionalFields = [
    { label: 'Current Company', name: 'current_company' },
    { label: 'Designation', name: 'designation' },
    { label: 'Current Location', name: 'current_location' },
    { label: 'Joined Date', name: 'joined_date', type: 'date' }
  ];
  // Contact Section Template
  const contactFields = [
    { label: 'Phone', name: 'phone' },
    { label: 'Alternate Phone', name: 'alt_phone' },
    { label: 'Current Address', name: 'current_address' },
    { label: 'Permanent Address', name: 'permanent_address' }
  ];

  return (
    <>
      <Header />
      <div className="profile-container alumni-profile-modern advanced-ui">
        <div className="profile-card-main card shadow rounded-4 p-4 mx-auto" style={{maxWidth: 800}}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="profile-photo-advanced mb-3" style={{ width: '180px', height: '220px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(26,42,108,0.10)', border: '3px solid #0d6efd', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {globalEdit ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {formData?.profile ? (
                    <img src={formData.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                  ) : (
                    <div className="profile-photo-placeholder alumni" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
                      <FaUser size={80} className="text-muted" />
                    </div>
                  )}
                  <label className="btn btn-primary rounded-circle position-absolute bottom-0 end-0" style={{ width: '40px', height: '40px', cursor: 'pointer' }} title="Upload profile photo">
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="d-none" />
                    <FaUser />
                  </label>
                </div>
              ) : (
                profileData.profile ? (
                  <img src={profileData.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                ) : (
                  <div className="profile-photo-placeholder alumni" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
                    <FaUser size={80} className="text-muted" />
                  </div>
                )
              )}
            </div>
            <h2 className="fw-bold text-primary mb-0">{profileData.first_name} {profileData.last_name}</h2>
            <span className="text-muted">{profileData.email}</span>
          </div>
          <div className="d-flex justify-content-end mb-3">
            {!globalEdit && (
              <button className="btn btn-primary px-4 py-2 fw-semibold" onClick={handleGlobalEdit} title="Edit Profile">
                <FaEdit className="me-2" />Edit Profile
              </button>
            )}
          </div>
          {globalEdit && (
            <div className="d-flex justify-content-end mb-4 gap-2">
              <button className="btn btn-success px-4 py-2 fw-semibold" onClick={handleGlobalSave}><FaSave className="me-2" />Save All</button>
              <button className="btn btn-secondary px-4 py-2 fw-semibold" onClick={handleGlobalCancel}>Cancel</button>
            </div>
          )}
          {/* Personal Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaUser className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Personal Information</h5>
        </div>
            {globalEdit ? (
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-4"><label>First Name</label><input name="first_name" value={formData?.first_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Middle Name</label><input name="middle_name" value={formData?.middle_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Last Name</label><input name="last_name" value={formData?.last_name || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Date of Birth</label><input name="dob" type="date" value={formData?.dob ? formData.dob.slice(0,10) : ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Gender</label><select name="gender" value={formData?.gender || ''} onChange={handleChange} className="form-control"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">First Name:</span> {profileData.first_name}</div>
                <div className="col-md-4"><span className="fw-semibold">Middle Name:</span> {profileData.middle_name || '-'}</div>
                <div className="col-md-4"><span className="fw-semibold">Last Name:</span> {profileData.last_name}</div>
                <div className="col-md-4"><span className="fw-semibold">Date of Birth:</span> {profileData.dob ? new Date(profileData.dob).toLocaleDateString() : '-'}</div>
                <div className="col-md-4"><span className="fw-semibold">Gender:</span> {profileData.gender}</div>
              </div>
            )}
              </div>
          {/* Academic Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaGraduationCap className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Academic Information</h5>
              </div>
            {globalEdit ? (
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-4"><label>Department</label><input name="department" value={formData?.department || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Course</label><input name="course" value={formData?.course || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Passing Year</label><input name="passing_year" value={formData?.passing_year || ''} onChange={handleChange} className="form-control" /></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">Department:</span> {profileData.department}</div>
                <div className="col-md-4"><span className="fw-semibold">Course:</span> {profileData.course}</div>
                <div className="col-md-4"><span className="fw-semibold">Passing Year:</span> {profileData.passing_year}</div>
              </div>
            )}
              </div>
          {/* Professional Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaBriefcase className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Professional Information</h5>
            </div>
            {globalEdit ? (
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-4"><label>Current Company</label><input name="current_company" value={formData?.current_company || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Designation</label><input name="designation" value={formData?.designation || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Current Location</label><input name="current_location" value={formData?.current_location || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Joined Date</label><input name="joined_date" type="date" value={formData?.joined_date ? formData.joined_date.slice(0,10) : ''} onChange={handleChange} className="form-control" /></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">Current Company:</span> {profileData.current_company}</div>
                <div className="col-md-4"><span className="fw-semibold">Designation:</span> {profileData.designation}</div>
                <div className="col-md-4"><span className="fw-semibold">Current Location:</span> {profileData.current_location}</div>
                <div className="col-md-4"><span className="fw-semibold">Joined Date:</span> {profileData.joined_date ? new Date(profileData.joined_date).toLocaleDateString() : '-'}</div>
          </div>
            )}
          </div>
          {/* Contact Section */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaPhone className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Contact Information</h5>
              </div>
            {globalEdit ? (
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-4"><label>Phone</label><input name="phone" value={formData?.phone || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Alternate Phone</label><input name="alt_phone" value={formData?.alt_phone || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Current Address</label><input name="current_address" value={formData?.current_address || ''} onChange={handleChange} className="form-control" /></div>
                <div className="col-md-4"><label>Permanent Address</label><input name="permanent_address" value={formData?.permanent_address || ''} onChange={handleChange} className="form-control" /></div>
              </form>
            ) : (
              <div className="row g-3">
                <div className="col-md-4"><span className="fw-semibold">Phone:</span> {profileData.phone}</div>
                <div className="col-md-4"><span className="fw-semibold">Alternate Phone:</span> {profileData.alt_phone}</div>
                <div className="col-md-4"><span className="fw-semibold">Current Address:</span> {profileData.current_address}</div>
                <div className="col-md-4"><span className="fw-semibold">Permanent Address:</span> {profileData.permanent_address}</div>
              </div>
            )}
              </div>
          {/* Skills Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaTools className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Skill Set</h5>
            </div>
            {globalEdit ? (
              <div>
                {(formData?.skillset || []).map((skill, idx) => (
                  <div className="d-flex align-items-center mb-2" key={idx}>
                    <input className="form-control me-2" value={skill} onChange={e => handleArrayChange('skillset', idx, undefined, e.target.value)} />
                    <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('skillset', idx)}><FaTrash /></button>
                  </div>
                ))}
                <button className="btn btn-outline-primary mb-2" onClick={() => handleArrayAdd('skillset', '')}><FaPlus /> Add Skill</button>
              </div>
            ) : (
              <div className="profile-skillset-container mb-3">
                {(profileData.skillset || []).map((skill, idx) => (
                  <span key={idx} className="badge bg-primary me-2 mb-2" style={{fontSize: '1em', padding: '0.5em 1em'}}>{skill}</span>
                ))}
              </div>
            )}
          </div>
          {/* Projects Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaProjectDiagram className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Projects</h5>
            </div>
            <div className="mb-2 fw-semibold text-secondary">Project List</div>
            {globalEdit ? (
              <div>
                {(formData?.projects || []).map((proj, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Project {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('projects', idx)}><FaTrash /></button>
          </div>
                    <div className="row g-2">
                      <div className="col-md-4"><input className="form-control" placeholder="Title" value={proj.title} onChange={e => handleArrayChange('projects', idx, 'title', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Technologies" value={proj.technologies} onChange={e => handleArrayChange('projects', idx, 'technologies', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Duration" value={proj.duration} onChange={e => handleArrayChange('projects', idx, 'duration', e.target.value)} /></div>
                      <div className="col-12"><textarea className="form-control" placeholder="Description" value={proj.description} onChange={e => handleArrayChange('projects', idx, 'description', e.target.value)} /></div>
                      <div className="col-12"><input className="form-control" placeholder="Project Link" value={proj.link} onChange={e => handleArrayChange('projects', idx, 'link', e.target.value)} /></div>
          </div>
                  </div>
                ))}
                <button className="btn btn-outline-primary mb-2" onClick={() => handleArrayAdd('projects', { title: '', technologies: '', duration: '', description: '', link: '' })}><FaPlus /> Add Project</button>
                  </div>
            ) : (
              <div>
                {(profileData.projects || []).map((proj, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">Project {idx + 1}: {proj.title}</div>
                    <div className="small text-muted">{proj.technologies}</div>
                    <div>{proj.description}</div>
                    <div className="small">Duration: {proj.duration}</div>
                    <div className="small">{proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer">View Project</a>}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Experience Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaBriefcase className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Work Experience</h5>
            </div>
            <div className="mb-2 fw-semibold text-secondary">Experience List</div>
            {globalEdit ? (
              <div>
                {(formData?.experience || []).map((exp, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Experience {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('experience', idx)}><FaTrash /></button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-4"><input className="form-control" placeholder="Company" value={exp.company} onChange={e => handleArrayChange('experience', idx, 'company', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Position" value={exp.position} onChange={e => handleArrayChange('experience', idx, 'position', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Duration" value={exp.duration} onChange={e => handleArrayChange('experience', idx, 'duration', e.target.value)} /></div>
                      <div className="col-12"><textarea className="form-control" placeholder="Description" value={exp.description} onChange={e => handleArrayChange('experience', idx, 'description', e.target.value)} /></div>
          </div>
        </div>
                ))}
                <button className="btn btn-outline-primary mb-2" onClick={() => handleArrayAdd('experience', { company: '', position: '', duration: '', description: '' })}><FaPlus /> Add Experience</button>
              </div>
            ) : (
              <div>
                {(profileData.experience || []).map((exp, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">Experience {idx + 1}: {exp.company} <span className="text-muted">({exp.position})</span></div>
                    <div className="small text-muted">{exp.duration}</div>
                    <div>{exp.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Achievements Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaTrophy className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Achievements</h5>
            </div>
            <div className="mb-2 fw-semibold text-secondary">Achievements List</div>
            {globalEdit ? (
              <div>
                {(formData?.achievements || []).map((ach, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Achievement {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('achievements', idx)}><FaTrash /></button>
                    </div>
                    <div className="row g-2">
                      <div className="col-md-4">
                        <select
                          className="form-control"
                          value={ach.type}
                          onChange={e => handleArrayChange('achievements', idx, 'type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="sports">Sports</option>
                          <option value="awards">Awards</option>
                          <option value="academic">Academic</option>
                          <option value="events">Events</option>
                        </select>
                      </div>
                      <div className="col-md-4"><input className="form-control" placeholder="Title" value={ach.title} onChange={e => handleArrayChange('achievements', idx, 'title', e.target.value)} /></div>
                      <div className="col-md-4"><input className="form-control" placeholder="Date" value={ach.date} onChange={e => handleArrayChange('achievements', idx, 'date', e.target.value)} /></div>
                      <div className="col-12"><input className="form-control" placeholder="Organization" value={ach.organization} onChange={e => handleArrayChange('achievements', idx, 'organization', e.target.value)} /></div>
                      <div className="col-12"><textarea className="form-control" placeholder="Description" value={ach.description} onChange={e => handleArrayChange('achievements', idx, 'description', e.target.value)} /></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-primary mb-2" onClick={() => handleArrayAdd('achievements', { type: '', title: '', date: '', organization: '', description: '' })}><FaPlus /> Add Achievement</button>
              </div>
            ) : (
              <div>
                {(profileData.achievements || []).map((ach, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">Achievement {idx + 1}: {ach.title} <span className="text-muted">({ach.type})</span></div>
                    <div className="small text-muted">{ach.date} | {ach.organization}</div>
                    <div>{ach.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Education Section (Array) */}
          <div className="profile-section-card card mb-4 p-4 rounded-4 shadow-sm profile-card-hover">
            <div className="section-header d-flex align-items-center mb-3 border-bottom pb-2">
              <FaGraduationCap className="me-2 text-primary" />
              <h5 className="mb-0 fw-bold flex-grow-1">Education Details</h5>
        </div>
            {globalEdit ? (
              <div>
                {(formData?.education || []).map((edu, idx) => (
                  <div className="profile-card mb-3 p-3 bg-light rounded-3" key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">Education {idx + 1}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => handleArrayRemove('education', idx)}><FaTrash /></button>
          </div>
                    <div className="row g-2">
                      <div className="col-md-3">
                        <select
                          className="form-control"
                          value={edu.type}
                          onChange={e => handleArrayChange('education', idx, 'type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="10th">10th</option>
                          <option value="12th">12th</option>
                          <option value="Graduation">Graduation</option>
                          <option value="Post Graduation">Post Graduation</option>
                        </select>
                      </div>
                      <div className="col-md-3"><input className="form-control" placeholder="Institution" value={edu.institution} onChange={e => handleArrayChange('education', idx, 'institution', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Board/University" value={edu.board} onChange={e => handleArrayChange('education', idx, 'board', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Year" value={edu.year} onChange={e => handleArrayChange('education', idx, 'year', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Grade" value={edu.grade} onChange={e => handleArrayChange('education', idx, 'grade', e.target.value)} /></div>
                      <div className="col-md-3"><input className="form-control" placeholder="Percentage" value={edu.percentage} onChange={e => handleArrayChange('education', idx, 'percentage', e.target.value)} /></div>
                  </div>
                  </div>
                ))}
                <button className="btn btn-outline-primary mb-2" onClick={() => handleArrayAdd('education', { type: '', institution: '', board: '', year: '', grade: '', percentage: '' })}><FaPlus /> Add Education</button>
                  </div>
            ) : (
              <div>
                {(profileData.education || []).map((edu, idx) => (
                  <div key={idx} className="profile-card mb-3 p-3 bg-light rounded-3">
                    <div className="fw-bold">{edu.institution} <span className="text-muted">({edu.type})</span></div>
                    <div className="small text-muted">{edu.board} | {edu.year} | Grade: {edu.grade} | {edu.percentage}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {globalEdit && (
            <div className="d-flex justify-content-end mt-4 gap-2">
              <button className="btn btn-success px-4 py-2 fw-semibold" onClick={handleGlobalSave}><FaSave className="me-2" />Save All</button>
              <button className="btn btn-secondary px-4 py-2 fw-semibold" onClick={handleGlobalCancel}>Cancel</button>
        </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlumniProfile;
