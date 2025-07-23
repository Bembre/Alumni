import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaUsers, FaClock, FaLink, FaMapMarkerAlt, FaRegCalendarCheck, FaSave, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import Header from './Header';
import './Adash.css'; // Reusing existing CSS
import api from '../services/api';
import { alumniService } from '../services/api';

const AddEvent = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState("webinar");
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    link: "",
    venue: "",
    expiryDate: "",
    maxParticipants: "",
    targetBatchYears: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passingYears, setPassingYears] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);

  useEffect(() => {
    fetchPassingYears();
  }, []);

  const fetchPassingYears = async () => {
    try {
      const years = await alumniService.getPassingYears();
      setPassingYears(years);
    } catch (error) {
      console.error('Error fetching passing years:', error);
      setError('Failed to fetch passing years. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchYearChange = (e) => {
    const selectedYears = Array.from(e.target.selectedOptions, option => option.value);
    setEventData(prev => ({
      ...prev,
      targetBatchYears: selectedYears
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation for common fields
    if (!eventData.title.trim()) {
      setError('Event title is required.');
      setLoading(false);
      return;
    }
    if (!eventData.description.trim()) {
      setError('Event description is required.');
      setLoading(false);
      return;
    }
    if (!eventData.date) {
      setError('Event date is required.');
      setLoading(false);
      return;
    }
    if (!eventData.time) {
      setError('Event time is required.');
      setLoading(false);
      return;
    }

    // Validation for event type specific fields
    if (eventType === 'webinar' && !eventData.link.trim()) {
      setError('Webinar link is required.');
      setLoading(false);
      return;
    }

    if (["reunion", "knowledge_sharing", "expert_lecture"].includes(eventType) && !eventData.venue.trim()) {
      setError('Venue is required for this event type.');
      setLoading(false);
      return;
    }

    // Validation for max participants
    if (eventData.maxParticipants && (isNaN(eventData.maxParticipants) || Number(eventData.maxParticipants) < 1)) {
      setError('Max participants must be a positive number.');
      setLoading(false);
      return;
    }

    // Expiry date validation
    if (eventData.expiryDate && eventData.date) {
      if (eventData.expiryDate > eventData.date) {
        setError('Registration Expiry Date cannot be after the Event Date.');
        setLoading(false);
        return;
      }
      if (eventData.expiryDate < today) {
        setError('Registration Expiry Date cannot be in the past.');
        setLoading(false);
        return;
      }
    }

    try {
      // Set default expiry date to event date if not specified
      let expiryDate = eventData.expiryDate;
      if (!expiryDate) {
        expiryDate = eventData.date;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("You must be logged in to add an event");
      }

      // Prepare payload
      const payload = {
        type: eventType,
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        date: eventData.date,
        time: eventData.time,
        expiryDate,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        batches: eventData.targetBatchYears,
      };

      // Add venue or link based on event type
      if (["reunion", "knowledge_sharing", "expert_lecture"].includes(eventType)) {
        payload.venue = eventData.venue.trim();
      } else if (eventType === "webinar") {
        payload.link = eventData.link.trim();
      }

      console.log('Submitting event payload:', payload); // Debug log

      const response = await api.post('/api/event/add', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && (response.data.success === true || (response.data.message && response.data.message.toLowerCase().includes('event created')))) {
        setSuccess(true);
        setEventData({
          title: "",
          description: "",
          date: "",
          time: "",
          link: "",
          venue: "",
          expiryDate: "",
          maxParticipants: "",
          targetBatchYears: []
        });
        
        // Redirect to events page after 2 seconds
        setTimeout(() => {
          navigate('/events');
        }, 2000);
      } else {
        setError("Failed to add event: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      setError(error.response?.data?.error || error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date for event (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="card p-4 shadow-lg rounded-4">
          <h2 className="text-center mb-4 text-primary fw-bold">
            <FaCalendarAlt className="me-2" />
            Add New Event
          </h2>

          {success && (
            <div className="alert alert-success mb-4">
              Event added successfully! Redirecting to events page...
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Event Type Selector */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Event Type *</label>
              <select
                className="form-select"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
              >
                <option value="reunion">Reunion</option>
                <option value="knowledge_sharing">Knowledge Sharing Session</option>
                <option value="webinar">Webinar</option>
                <option value="expert_lecture">Expert Lecture</option>
              </select>
            </div>

            {/* Common Fields */}
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-control"
                name="title"
                value={eventData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                name="description"
                value={eventData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Provide details about the event"
                required
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  <FaCalendarAlt className="me-1" /> Event Date *
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={eventData.date}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  <FaClock className="me-1" /> Event Time *
                </label>
                <input
                  type="time"
                  className="form-control"
                  name="time"
                  value={eventData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">
                  <FaRegCalendarCheck className="me-1" /> Registration Expiry Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="expiryDate"
                  value={eventData.expiryDate}
                  onChange={handleChange}
                  min={today}
                  max={eventData.date || ''}
                  placeholder="When should registration close? (Default: Event date)"
                />
                <small className="text-muted">
                  If not specified, registration will close on the event date
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  <FaUsers className="me-1" /> Maximum Participants
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="maxParticipants"
                  value={eventData.maxParticipants}
                  onChange={handleChange}
                  min="1"
                  placeholder="Leave empty for unlimited"
                  onKeyDown={e => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                />
              </div>
            </div>

            {/* Conditional Fields: Venue or Link */}
            {["reunion", "knowledge_sharing", "expert_lecture"].includes(eventType) ? (
              <div className="mb-3">
                <label className="form-label">
                  <FaMapMarkerAlt className="me-1" /> Venue *
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="venue"
                  value={eventData.venue}
                  onChange={handleChange}
                  placeholder="Enter the location for the event"
                  required
                />
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label">
                  <FaLink className="me-1" /> Webinar Link *
                </label>
                <input
                  type="url"
                  className="form-control"
                  name="link"
                  value={eventData.link}
                  onChange={handleChange}
                  placeholder="Enter meeting URL (e.g. Zoom, Teams, Google Meet)"
                  required
                />
              </div>
            )}

            {/* Batch selection only for reunion */}
            {eventType === 'reunion' && (
              <div className="mb-3">
                <label className="form-label">Select Batch(es) for Invitation</label>
                <select
                  multiple
                  className="form-select"
                  value={eventData.targetBatchYears}
                  onChange={handleBatchYearChange}
                >
                  {passingYears.map(year => (
                    <option key={year} value={year}>Batch of {year}</option>
                  ))}
                </select>
                <small className="text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple batches.</small>
              </div>
            )}

            <div className="text-center mt-4">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-100"
                style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }}
                disabled={loading}
              >
                {loading ? "Creating Event..." : "Add Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEvent;
