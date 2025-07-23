import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaLink, FaSave, FaBuilding, FaExclamationTriangle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { jobService } from '../services/api';
import Header from './Header';
import './CommonStyles.css';
import { toast } from 'react-hot-toast';

const PostJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    location: '',
    type: '',
    salary: '',
    description: '',
    link: '',
    expireDate: ''
  });

  useEffect(() => {
    if (jobId) {
      // Editing: fetch job data
      const fetchJob = async () => {
        try {
          const job = await jobService.getJob(jobId);
          setFormData({
            title: job.title,
            name: job.name,
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            link: job.link,
            expireDate: job.expireDate?.slice(0, 10) || ''
          });
        } catch (err) {
          setError('Failed to load job for editing.');
        }
      };
      fetchJob();
    }
  }, [jobId]);

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
    setSuccess('');
    setIsSubmitting(true);
    // Validation
    if (!formData.title) {
      setError('Job title is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.name) {
      setError('Company name is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.location) {
      setError('Location is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.type) {
      setError('Job type is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.salary) {
      setError('Salary is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.description) {
      setError('Job description is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.link) {
      setError('Application link is required.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.expireDate) {
      setError('Application deadline is required.');
      setIsSubmitting(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (formData.expireDate < today) {
      setError('Application deadline cannot be in the past.');
      setIsSubmitting(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));

      if (!user) {
        navigate('/auth');
        return;
      }

      if (jobId) {
        // Editing
        await jobService.updateJob(jobId, formData);
        setSuccess('Job updated successfully! Redirecting to jobs page...');
      } else {
        // Posting new job
        await jobService.postJob({
          ...formData,
          postedBy: user.email
        });
        setSuccess('Job posted successfully! Redirecting to jobs page...');
      }

      setFormData({
        title: '',
        name: '',
        location: '',
        type: '',
        salary: '',
        description: '',
        link: '',
        expireDate: ''
      });

      // Redirect to jobs list after 2 seconds
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);

    } catch (error) {
      console.error('Error posting job:', error);
      let errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="content">
        <div className="form-header">
          <h2>
            <FaBriefcase className="me-2" />
            {jobId ? 'Edit Job' : 'Post a New Job'}
          </h2>
          <button 
            className="btn btn-outline-secondary back-button"
            onClick={() => navigate('/jobs')}
          >
            <FaArrowLeft className="me-2" />
            Back to Jobs
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <FaExclamationTriangle className="me-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FaCheckCircle className="me-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">
                <FaBriefcase className="me-2" />
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter job title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">
                <FaBuilding className="me-2" />
                Company Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">
                <FaMapMarkerAlt className="me-2" />
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter job location"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">
                <FaBriefcase className="me-2" />
                Job Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">Select job type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="salary">
                <FaMoneyBillWave className="me-2" />
                Salary *
              </label>
              <input
                type="text"
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter salary range"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expireDate">
                <FaCalendarAlt className="me-2" />
                Application Deadline *
              </label>
              <input
                type="date"
                id="expireDate"
                name="expireDate"
                value={formData.expireDate}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">
                <FaBriefcase className="me-2" />
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="5"
                placeholder="Enter detailed job description"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="link">
                <FaLink className="me-2" />
                Application Link *
              </label>
              <input
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter application link"
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
              <FaSave className="me-2" />
              {isSubmitting ? 'Posting...' : (jobId ? 'Update Job' : 'Post Job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob; 