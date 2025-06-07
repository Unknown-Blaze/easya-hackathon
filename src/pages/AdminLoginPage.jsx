// src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { FaLeaf } from 'react-icons/fa';
import classes from './AdminLoginPage.module.css'; // Correct import

// REMOVE THE ENTIRE 'const styles = { ... }' OBJECT HERE

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError('Failed to log in. Please check your email and password.');
    }
    setLoading(false);
  };

  if (currentUser) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className={classes.pageContainer}> {/* CHANGED */}
      <div className={classes.loginBox}> {/* CHANGED */}
        <div className={classes.logoContainer}> {/* CHANGED */}
          <FaLeaf />
        </div>
        <h2 className={classes.title}>Admin Portal</h2> {/* CHANGED */}
        {error && <p className={classes.error}>{error}</p>} {/* CHANGED */}
        <form onSubmit={handleSubmit}>
          <div className={classes.formGroup}> {/* CHANGED */}
            <label htmlFor="email" className={classes.label}>Email Address</label> {/* CHANGED */}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={classes.input} // CHANGED
            />
          </div>
          <div className={classes.formGroup}> {/* CHANGED */}
            <label htmlFor="password" className={classes.label}>Password</label> {/* CHANGED */}
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={classes.input} // CHANGED
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={classes.button} // CHANGED
            // REMOVED onMouseEnter/onMouseLeave - hover is handled by AdminLoginPage.module.css
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <Link to="/" className={classes.backLink}>← Back to Main Page</Link> {/* CHANGED */}
      </div>
    </div>
  );
};

export default AdminLoginPage;