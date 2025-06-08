import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { FiDollarSign, FiArrowLeft, FiCheckCircle, FiLoader, FiAlertCircle } from 'react-icons/fi';
import classes from './ProjectDonationPage.module.css';

// This would typically be in a shared file, but is duplicated here for simplicity.
const MOCK_PROJECT_DETAILS = {
  '1': {
    name: "Clean Water Initiative - Rural Village A",
    ngoName: "AquaHope Foundation",
  },
  '2': {
    name: "School Supplies for Underprivileged Children",
    ngoName: "LearnForward Org",
  }
};

const PRESET_AMOUNTS = [10, 25, 50, 100];

const ProjectDonationPage = () => { // Consider renaming this component if it's a donation page
  const { projectId } = useParams();
  const location = useLocation();

  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donationStatus, setDonationStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState(null);

  // Initialize project from location.state if available, otherwise null
  const [project, setProject] = useState(() => location.state?.project || null); 
  const [isLoadingProject, setIsLoadingProject] = useState(!location.state?.project); // True if we need to fetch

  useEffect(() => {
    // Only try to "fetch" or set from MOCK if:
    // 1. Project data wasn't passed via location.state initially OR
    // 2. The projectId from the URL has changed and doesn't match the current project.
    if (!project || (projectId && project && project.id !== projectId)) { // Assuming your MOCK_PROJECT_DETAILS items could have an 'id' field matching projectId
      setIsLoadingProject(true); // Explicitly set loading true when we intend to fetch/set
      console.log(`useEffect: Fetching/setting project for projectId: ${projectId}`);
      
      const projectDataFromMock = MOCK_PROJECT_DETAILS[projectId];
      console.log(projectDataFromMock)

      if (projectDataFromMock) {
        // To make it compatible with the (projectId && project && project.id !== projectId) check,
        // let's add an 'id' to our project object if it's not there.
        setProject({ ...projectDataFromMock, id: projectId }); 
      } else {
        console.error(`Project with ID ${projectId} not found in MOCK_PROJECT_DETAILS.`);
        setProject(null); // Explicitly set to null if not found
        // You might want to set an error state here to show "Project not found"
      }
      setIsLoadingProject(false);
    } else if (project && !isLoadingProject) {
        // If project was passed via location.state, ensure isLoadingProject is false.
        // This handles the case where location.state.project was initially provided.
        setIsLoadingProject(false);
    }
  }, [projectId, location.state]);

  const handleAmountClick = (presetValue) => {
    setAmount(presetValue);
    setCustomAmount(''); // Clear custom amount input
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Allow numbers and a single decimal
      setCustomAmount(value);
      setAmount(value);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
        setErrorMessage("Please enter a valid amount.");
        setDonationStatus('error');
        return;
    }
    
    setDonationStatus('processing');
    setErrorMessage('');
    
    console.log(`Initiating donation of ${amount} to project ${projectId}`);
    
    // ===================================================================
    // == PLACEHOLDER: XRPL/XUMM TRANSACTION LOGIC GOES HERE ==
    // ===================================================================
    // In a real application, you would integrate with a wallet SDK
    // like Xumm or use xrpl.js to create and sign a transaction.
    //
    // Example with a fictional SDK:
    // try {
    //   const payload = { txjson: { TransactionType: 'Payment', ... } };
    //   const result = await xumm.sdk.payload.createAndSubscribe(payload);
    //   setTransactionId(result.payload.txid);
    //   setDonationStatus('success');
    // } catch (err) {
    //   setErrorMessage(err.message || "The transaction was cancelled or failed.");
    //   setDonationStatus('error');
    // }
    // ===================================================================
    
    // Simulating an API call for demonstration purposes
  }
  // This loading condition is now more explicit
  if (isLoadingProject) {
    return (
      <div className={classes.pageContainer} style={{textAlign: 'center', paddingTop: '50px'}}>
        <FiLoader className={classes.spinner} style={{fontSize: '2em', animation: 'spin 1s linear infinite'}} />
        <p style={{marginTop: '10px', color: '#333'}}>Loading project details...</p>
      </div>
    );
  }

  if (!project && !isLoadingProject) { // After loading, if project is still null (e.g., not found)
    return (
      <div className={classes.pageContainer} style={{textAlign: 'center', paddingTop: '50px'}}>
        <FiAlertCircle style={{fontSize: '2em', color: 'red', marginBottom: '10px'}} />
        <p style={{color: '#333'}}>Project not found.</p>
        <Link to="/" className={classes.backLink} style={{marginTop: '20px'}}>Go to Home</Link>
      </div>
    );
  }
  
  // The rest of your component's return statement for 'idle', 'processing', 'error', 'success' states
  // This part assumes 'project' is now correctly populated if it exists.

  if (donationStatus === 'idle' || donationStatus === 'processing' || donationStatus === 'error') {
    return (
      <div className={classes.pageContainer}>
        {/* ... rest of your form JSX ... it should now have a valid 'project' object */}
        <div className={classes.formContainer}>
          <Link to={`/projects/${project.id || projectId}`} className={classes.backLink}> {/* Use project.id if available */}
            <FiArrowLeft /> Back to Project
          </Link>
          <div className={classes.header}>
            <h3>You are donating to:</h3>
            <h1>{project.name}</h1>
            <p className={classes.ngoName}>by {project.ngoName}</p>
          </div>
          {/* ... form elements ... */}
           <form onSubmit={handleDonate}>
            <label htmlFor="amount" className={classes.label}>Choose an amount (USD)</label>
            <div className={classes.presetGrid}>
              {PRESET_AMOUNTS.map(val => (
                <button 
                  key={val} 
                  type="button"
                  className={`${classes.presetButton} ${amount === val ? classes.selected : ''}`}
                  onClick={() => handleAmountClick(val)}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div className={classes.customAmountWrapper}>
              <span>$</span>
              <input
                type="text"
                id="amount"
                className={classes.customAmountInput}
                placeholder="Or enter a custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
              />
            </div>

            {donationStatus === 'error' && (
              <div className={classes.statusMessageError}>
                <FiAlertCircle /> {errorMessage}
              </div>
            )}

            <button type="submit" className={classes.donateButton} disabled={donationStatus === 'processing'}>
              {donationStatus === 'processing' ? (
                <>
                  <FiLoader className={classes.spinner} style={{animation: 'spin 1s linear infinite'}} /> Processing...
                </>
              ) : (
                <>
                  <FiDollarSign /> Donate Now
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (donationStatus === 'success') {
      return (
        // ... your success JSX ...
        <div className={classes.pageContainer}>
            <div className={`${classes.formContainer} ${classes.successContainer}`}>
                <FiCheckCircle className={classes.successIcon} />
                <h1>Thank You!</h1>
                <p>Your donation to <strong>{project.name}</strong> was successful.</p>
                <p>Your generosity is making a real difference.</p>
                <div className={classes.txDetails}>
                    <strong>Transaction ID:</strong>
                    <span>{transactionId}</span>
                </div>
                <Link to={`/projects/${project.id || projectId}`} className={classes.backToProjectButton}>
                    Return to Project Page
                </Link>
            </div>
        </div>
      )
  }

  // Fallback or default return if none of the above conditions are met (shouldn't happen with this logic)
  return null; 
};

export default ProjectDonationPage; // Or DonatePage