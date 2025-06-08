// src/pages/SignupPage.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect for logging
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import classes from './AdminLoginPage.module.css';
import { FiLoader } from 'react-icons/fi';
import { getAddress } from '@gemwallet/api';

const SignupPage = () => {
  const [userType, setUserType] = useState('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [description, setDescription] = useState('');

  const [showSeedModal, setShowSeedModal] = useState(false);
  const [generatedSeed, setGeneratedSeed] = useState(null);

  const { signup, currentUser, currentUserProfile } = useAuth(); // Ensure currentUserProfile is destructured
  const navigate = useNavigate();

  // Logging for debugging the redirect
  useEffect(() => {
    console.log("SignupPage Effect: currentUser:", currentUser, "currentUserProfile:", currentUserProfile, "showSeedModal:", showSeedModal);
  }, [currentUser, currentUserProfile, showSeedModal]);


  const handleStepChange = (message) => {
    setLoadingMessage(message || '');
  };

  async function connectGemWallet() {
    const response = await getAddress();
  
    if (response.status === 'success') {
      console.log('Wallet address:', response.address);
    } else {
      console.error('User rejected or GemWallet not installed');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password should be at least 6 characters.");

    setError('');
    setGeneratedSeed(null);
    setShowSeedModal(false); // Ensure modal is hidden at start of new attempt
    setLoading(true);
    handleStepChange("Starting registration...");

    let nameToRegister;
    let additionalData = { userType };

    if (userType === 'donor') {
      if (!displayName.trim()) { setLoading(false); handleStepChange(''); return setError("Full Name is required for donors."); }
      nameToRegister = displayName;
    } else {
      if (!organizationName.trim()) { setLoading(false); handleStepChange(''); return setError("Organization Name is required."); }
      if (!contactPersonName.trim()) { setLoading(false); handleStepChange(''); return setError("Contact Person Name is required."); }
      if (!organizationType) { setLoading(false); handleStepChange(''); return setError("Organization Type is required."); }
      nameToRegister = contactPersonName;
      additionalData = { ...additionalData, organizationName, contactPersonName, organizationType, registrationNumber, description };
    }

    try {
      console.log("SignupPage: Calling signup function...");
      const result = await connectGemWallet();
      // const result = await signup(email, password, nameToRegister, additionalData, handleStepChange);
      console.log("SignupPage: Signup function returned:", result);

      if (result && result.seed) {
        setGeneratedSeed(result.seed);
        setShowSeedModal(true);
        // setLoading(false) and handleStepChange('') will be handled in finally
      } else {
        // This case means signup completed, wallet was created (and address stored), but no seed needs to be shown
        // or wallet creation was optional and skipped successfully.
        console.log("SignupPage: Signup successful, no seed to display or wallet optional. Navigating to profile.");
        navigate('/profile');
      }
    } catch (err) {
      console.error("SignupPage Error in handleSubmit:", err);
      setError(err.message || 'Failed to create an account. Please try again.');
      // setLoading(false) and handleStepChange('') will be handled in finally
    } finally {
      setLoading(false);
      handleStepChange('');
    }
  };

  const handleSeedAcknowledged = () => {
    setShowSeedModal(false);
    setGeneratedSeed(null);
    console.log("SignupPage: Seed acknowledged. Navigating to profile.");
    navigate('/profile');
  };

  // THE CRUCIAL REDIRECT LOGIC:
  // Only redirect if the user is authenticated, their profile is loaded (meaning signup process is fully complete on Firestore side),
  // AND the seed modal is not supposed to be shown.
  if (currentUser && currentUserProfile && !showSeedModal) {
    console.log("SignupPage: Top-level redirect check. Navigating to /profile because currentUser, currentUserProfile exist and showSeedModal is false.");
    return <Navigate to="/profile" replace />;
  }

  // Render functions for donor/nonprofit fields (no changes from previous version)
  const renderDonorFieldsJsx = (
    <>
      <div className={classes.formGroup}>
        <label htmlFor="displayName" className={classes.label}>Full Name</label>
        <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={classes.input} disabled={loading || showSeedModal} />
      </div>
    </>
  );
  const renderNonprofitFieldsJsx = (
    <>
      <div className={classes.formGroup}>
        <label htmlFor="organizationName" className={classes.label}>Organization Name</label>
        <input type="text" id="organizationName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required className={classes.input} disabled={loading || showSeedModal} />
      </div>
      <div className={classes.formGroup}>
        <label htmlFor="contactPersonName" className={classes.label}>Contact Person Full Name</label>
        <input type="text" id="contactPersonName" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} required className={classes.input} disabled={loading || showSeedModal} />
      </div>
      <div className={classes.formGroup}>
        <label htmlFor="organizationType" className={classes.label}>Type of Organization</label>
        <select id="organizationType" value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} required className={classes.select} disabled={loading || showSeedModal}>
          <option value="">Select Type...</option>
          <option value="charity">Registered Charity</option>
          <option value="foundation">Foundation</option>
          <option value="community_group">Community Group</option>
          <option value="social_enterprise">Social Enterprise</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className={classes.formGroup}>
        <label htmlFor="registrationNumber" className={classes.label}>Registration Number (if applicable)</label>
        <input type="text" id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className={classes.input} disabled={loading || showSeedModal} />
      </div>
      <div className={classes.formGroup}>
        <label htmlFor="description" className={classes.label}>Brief Description of Organization</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className={classes.textarea} placeholder="What your organization does, its mission..." disabled={loading || showSeedModal} />
      </div>
    </>
  );

  // Seed Modal JSX (no changes from previous version)
  const SeedModal = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center', maxWidth: '500px', margin: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
        <h3 style={{ color: '#0D253F', marginBottom: '15px', fontSize: '1.4em' }}>IMPORTANT: Secure Your Wallet!</h3>
        <p style={{ color: '#34495E', marginBottom: '10px', fontSize: '0.95em', lineHeight: '1.6' }}>Your XRPL wallet has been created. Please write down the following SEED phrase and store it in a very safe and private place. <strong style={{color: '#D32F2F'}}>You will NOT be shown this again.</strong></p>
        <p style={{ color: '#D32F2F', marginBottom: '20px', fontWeight: 'bold', fontSize: '1em' }}>Losing this seed means permanently losing access to your funds associated with this wallet.</p>
        <pre style={{ backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '4px', fontSize: '1.1em', color: '#0D253F', wordBreak: 'break-all', whiteSpace: 'pre-wrap', border: '1px dashed #01B4E4', marginBottom: '25px', textAlign: 'left' }}>
          {generatedSeed}
        </pre>
        <button onClick={handleSeedAcknowledged} className={classes.button} style={{backgroundColor: '#4CAF50', width: 'auto', padding: '12px 25px'}}>
          I Have Securely Saved My Seed - Proceed
        </button>
      </div>
    </div>
  );

  return (
    <div className={classes.pageContainer}>
      {showSeedModal && <SeedModal />}
      <div className={classes.formBox} style={showSeedModal ? { filter: 'blur(3px)' } : {}}> {/* Blur background when modal is open */}
        <h2 className={classes.title}>Register For nGoDONATE</h2>
        <div className={classes.userTypeToggle}>
          <button
            className={`${classes.toggleButton} ${userType === 'donor' ? classes.active : ''}`}
            onClick={() => setUserType('donor')}
            disabled={loading || showSeedModal}>
            I'm a Donor
          </button>
          <button
            className={`${classes.toggleButton} ${userType === 'nonprofit' ? classes.active : ''}`}
            onClick={() => setUserType('nonprofit')}
            disabled={loading || showSeedModal}>
            I'm a Nonprofit
          </button>
        </div>

        {error && <p className={classes.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {userType === 'donor' ? renderDonorFieldsJsx : renderNonprofitFieldsJsx}

          <div className={classes.formGroup}>
            <label htmlFor="email" className={classes.label}>Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={classes.input} autoComplete="email" disabled={loading || showSeedModal}/>
          </div>
          <div className={classes.formGroup}>
            <label htmlFor="password" className={classes.label}>Password (min. 6 characters)</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={classes.input} autoComplete="new-password" disabled={loading || showSeedModal}/>
          </div>
          <div className={classes.formGroup}>
            <label htmlFor="confirmPassword" className={classes.label}>Confirm Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={classes.input} autoComplete="new-password" disabled={loading || showSeedModal}/>
          </div>

          <button onClick={connectGemWallet}>Connect Wallet</button>

          <button type="submit" disabled={loading || showSeedModal} className={classes.button}>
            {loading ? (
              <>
                <FiLoader style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                {loadingMessage || 'Processing...'}
              </>
            ) : `Register ${userType === 'donor' ? 'as Donor' : 'Nonprofit'}`}
          </button>
        </form>

        {!showSeedModal && (
            <>
                <p className={classes.linkText}>
                Already have an account? <Link to="/login">Log In</Link>
                </p>
                <Link to="/" className={classes.backLink}>← Back to Home</Link>
            </>
        )}
      </div>
    </div>
  );
};

export default SignupPage;