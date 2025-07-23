import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundService } from '../services/api';
import Header from './Header';
import './Adash.css';

const AddDonation = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validation
    if (!form.title) {
      setError('Title is required.');
      setLoading(false);
      return;
    }
    if (!form.description) {
      setError('Description is required.');
      setLoading(false);
      return;
    }
    if (!form.amount) {
      setError('Amount is required.');
      setLoading(false);
      return;
    }
    if (isNaN(form.amount) || Number(form.amount) <= 0) {
      setError('Amount must be a positive number.');
      setLoading(false);
      return;
    }
    try {
      await fundService.createFund({
        title: form.title,
        description: form.description,
        amount: form.amount,
        url: ''
      });
      setSuccess(true);
      setForm({ title: '', description: '', amount: '' });
      setTimeout(() => navigate('/donation'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create donation campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container py-5">
        <div className="card p-4 shadow-lg rounded-4">
          <h2 className="text-center mb-4 text-primary fw-bold">
            Raise Donation Campaign
          </h2>
          <div className="alert alert-info mb-4 text-center">
            <strong>Note:</strong> The default UPI QR code and UPI ID will be used for all campaigns. Alumni will see the same payment details for every donation.
          </div>
          {success && (
            <div className="alert alert-success mb-4">
              Donation campaign created! Redirecting...
            </div>
          )}
          {error && (
            <div className="alert alert-danger mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Title *</label>
              <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows="3" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Target Amount (INR) *</label>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                min="1"
                onKeyDown={e => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100" style={{ minWidth: 160, borderRadius: '2em', boxShadow: '0 4px 15px rgba(26,42,108,0.15)', fontWeight: 600, transition: 'all 0.2s' }} disabled={loading}>{loading ? 'Creating...' : 'Create Campaign'}</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddDonation; 