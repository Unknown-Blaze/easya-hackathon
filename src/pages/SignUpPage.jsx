// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import classes from './AdminLoginPage.module.css'; // Reuse login page styles for now or create new

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, displayName);
      navigate('/profile'); // Redirect to homepage or user dashboard after signup
    } catch (err) {
      console.error("Signup error:", err);
      setError('Failed to create an account. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className={classes.pageContainer}>
      <div className={classes.loginBox}> {/* Reusing loginBox style */}
        <h2 className={classes.title}>Create Account</h2>
        {error && <p className={classes.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={classes.formGroup}>
            <label htmlFor="displayName" className={classes.label}>Full Name</label>
            <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={classes.input} />
          </div>
          <div className={classes.formGroup}>
            <label htmlFor="email" className={classes.label}>Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={classes.input} />
          </div>
          <div className={classes.formGroup}>
            <label htmlFor="password" className={classes.label}>Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={classes.input} />
          </div>
          <div className={classes.formGroup}>
            <label htmlFor="confirmPassword" className={classes.label}>Confirm Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={classes.input} />
          </div>
          <button type="submit" disabled={loading} className={classes.button}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '0.9em' }}>
          Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;