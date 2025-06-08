// src/pages/ProjectDisplayPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle, FiClock, FiLoader, FiArrowRightCircle, FiAlertCircle } from 'react-icons/fi'; // Added FiArrowRightCircle
import classes from './ProjectDisplayPage.module.css';
import { sendPayment } from '@gemwallet/api';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config';

const LATEST_TRANSACTIONS_ENDPOINT = 'http://127.0.0.1:8000/transaction/latest-transactions';
// Define the new milestone status endpoint
const MILESTONE_STATUS_ENDPOINT_BASE = 'http://127.0.0.1:8000/projects';

const ProjectDisplayPage = () => {
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState(null); // Firestore project data
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState(null);

  // --- Transaction State ---
  const [transactions, setTransactions] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);

  // --- Milestone State ---
  const [milestones, setMilestones] = useState([]); // Milestones with statuses from backend
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);
  const [advancingMilestones, setAdvancingMilestones] = useState(false); // For button loading state

  // Fetch initial project details from Firestore
  useEffect(() => {
    const fetchProject = async () => {
      // ... (existing fetchProject logic - no change here, it fetches from Firestore)
      // Make sure projectData.milestones (from Firestore) is used if needed for initial display,
      // but the polled milestones will have the dynamic statuses.
      if (!projectId) {
        setProjectError("No project ID provided.");
        setLoadingProject(false);
        return;
      }
      setLoadingProject(true);
      setProjectError(null);
      try {
        const projectDocRef = doc(db, 'charity_projects', projectId);
        const docSnap = await getDoc(projectDocRef);

        if (docSnap.exists()) {
          // Store the base project data (which might include an initial list of milestones)
          setProjectData({ id: docSnap.id, ...docSnap.data() });
          // Optionally, set initial milestones from Firestore if backend polling is delayed
          // This depends on whether your Firestore 'milestones' field has a 'status'
          if (docSnap.data().milestones) {
            setMilestones(docSnap.data().milestones.map(m => ({...m, id: m.id || m.name /* ensure id */})));
          }
        } else {
          setProjectError("Project not found.");
          setProjectData(null);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        setProjectError("Failed to load project details. Please try again.");
        setProjectData(null);
      } finally {
        setLoadingProject(false);
      }
    };
    fetchProject();
  }, [projectId]);

  // --- Milestone Fetching Logic ---
  const fetchMilestoneStatuses = useCallback(async () => {
    if (!projectId) return; // Need projectId
    // console.log("Fetching milestone statuses...");
    setIsLoadingMilestones(true);
    setMilestonesError(null);
    try {
      const url = `${MILESTONE_STATUS_ENDPOINT_BASE}/${projectId}/milestones/status`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${res.status}`);
      }
      const data = await res.json(); // Expected: List[MilestoneStatus]
      setMilestones(data);
    } catch (error) {
      console.error("Error fetching milestone statuses:", error);
      setMilestonesError(error.message || "Failed to fetch milestone statuses.");
    } finally {
      setIsLoadingMilestones(false);
    }
  }, [projectId]);

  // Initial and Polling for Milestone Statuses
  useEffect(() => {
    if (projectId) {
      fetchMilestoneStatuses(); // Initial fetch
      const intervalId = setInterval(fetchMilestoneStatuses, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId); // Cleanup
    }
  }, [projectId, fetchMilestoneStatuses]);

  // Handle "Advance Milestones" Button Click
  const handleRequestMilestoneAdvancement = async () => {
    if (!projectId) return;
    setAdvancingMilestones(true); // For button loading state
    try {
      const url = `${MILESTONE_STATUS_ENDPOINT_BASE}/${projectId}/milestones/request_advance`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `Failed to request advancement: ${res.status}`);
      }
      const data = await res.json();
      console.log(data.message); // E.g., "Milestone advancement sequence initiated..."
      // No need to directly change frontend state here; polling will pick up changes.
      // Optionally, show a success toast/message to the user.
    } catch (error) {
      console.error("Error requesting milestone advancement:", error);
      alert(`Error: ${error.message}`); // Simple error feedback
    } finally {
      setAdvancingMilestones(false);
    }
  };


  // --- Transaction Fetching Logic (existing) ---
  const fetchTransactions = useCallback(async (isInitialFetch = false) => {
    // ... (your existing fetchTransactions logic)
    if (!projectData) return;
    if (!isInitialFetch && isLoadingTx) return;

    setIsLoadingTx(true);
    setTxError(null);
    const url = new URL(LATEST_TRANSACTIONS_ENDPOINT);
    if (lastTxHash && !isInitialFetch) {
      url.searchParams.append('latest_tx_hash', lastTxHash);
    }
    if (projectData && projectData.xrpl_wallet) { // Assuming xrpl_wallet is the field name
        url.searchParams.append('account', projectData.xrpl_wallet);
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      const newTxs = data;

      if (newTxs && newTxs.length > 0) {
        const formattedTxs = newTxs.map(txData => {
          const tx = txData.tx || txData.transaction || txData;
          const meta = txData.meta || {};
          let amount = 'N/A';
          if (tx.TransactionType === "Payment") {
            if (typeof tx.Amount === 'string') {
              amount = `${parseFloat(tx.Amount) / 1000000} XRP`;
            } else if (typeof tx.Amount === 'object') {
              amount = `${tx.Amount.value} ${tx.Amount.currency}`;
            }
          }
          if (meta.delivered_amount) {
             if (typeof meta.delivered_amount === 'string') {
                amount = `${parseFloat(meta.delivered_amount) / 1000000} XRP (Delivered)`;
             } else if (typeof meta.delivered_amount === 'object') {
                amount = `${meta.delivered_amount.value} ${meta.delivered_amount.currency} (Delivered)`;
             }
          }
          return {
            hash: txData.hash || tx.hash,
            type: tx.TransactionType || 'Unknown',
            account: tx.Account || 'Unknown Source',
            destination: tx.Destination || 'Unknown Destination',
            amount: amount,
            name: tx.Account ? `User (${tx.Account.substring(0, 5)}...${tx.Account.substring(tx.Account.length - 5)})` : 'Anonymous Donor',
            email: tx.TransactionType === "Payment" ? `To: ${ (tx.Destination || 'Project Wallet').substring(0, 8) }...` : 'Blockchain Interaction',
            timestamp: tx.date ? new Date( (tx.date + 946684800) * 1000).toLocaleString() : new Date().toLocaleString(),
            // avatarUrl: `https://i.pravatar.cc/40?u=${tx.Account || Math.random()}` // Removed as it was not in screenshot
          };
        }).filter(Boolean);

        if (isInitialFetch) {
          setTransactions(formattedTxs.slice(0, 5));
        } else {
          setTransactions(prevTxs => [...formattedTxs, ...prevTxs].slice(0, 5));
        }
        if (formattedTxs.length > 0) {
            setLastTxHash(formattedTxs[0].hash);
        }
      } else if (isInitialFetch) {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTxError(error.message || "Failed to fetch transactions.");
    } finally {
      setIsLoadingTx(false);
    }
  }, [lastTxHash, isLoadingTx, projectData]);

  useEffect(() => {
    if (projectData) {
        fetchTransactions(true);
    }
  }, [projectData, fetchTransactions]);

  useEffect(() => {
    if (!projectData) return () => {};
    const intervalId = setInterval(() => {
        fetchTransactions(false);
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchTransactions, projectData]);

  // --- Payment Handler (existing) ---
  async function handleSendPayment() {
    // ... (your existing handleSendPayment logic)
    if (!projectData || !projectData.xrpl_wallet) {
      alert('Project wallet address not found.');
      return;
    }
    const transaction = { destination: projectData.xrpl_wallet, amount: '5' };
    try {
      const response = await sendPayment(transaction);
      if (response.status === 'success') {
        alert(`Payment successful! Hash: ${response.hash}`);
        fetchTransactions(true);
      } else {
        alert(`Payment failed: ${response.error || response.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`An unexpected error occurred: ${error.message}`);
    }
  }

  // --- UI Helper ---
  const getMilestoneStatusIcon = (status) => {
    const currentStatus = status ? status.toLowerCase() : "pending";
    if (currentStatus === "completed") return <FiCheckCircle className={`${classes.milestoneIcon} ${classes.completed}`} />;
    if (currentStatus === "in progress") return <FiLoader className={`${classes.milestoneIcon} ${classes.inProgress} ${classes.spinner}`} />;
    return <FiClock className={`${classes.milestoneIcon} ${classes.pending}`} />;
  };

  // --- Render Logic ---
  if (loadingProject) { /* ... loading UI ... */ 
    return <div className={classes.pageContainer} style={{ textAlign: 'center', paddingTop: '50px' }}><FiLoader className={classes.spinner} style={{ fontSize: '2em' }} /> <p>Loading project details...</p></div>;
  }
  if (projectError) { /* ... error UI ... */ 
    return <div className={classes.pageContainer} style={{ textAlign: 'center', paddingTop: '50px' }}><FiAlertCircle style={{ fontSize: '2em', color: 'red' }}/> <p>{projectError}</p></div>;
  }
  if (!projectData) { /* ... no project data UI ... */ 
    return <div className={classes.pageContainer}><p>Project information is unavailable.</p></div>;
  }

  return (
    <div className={classes.pageContainer}>
      <div className={classes.projectHeader}>
        <h1>{projectData.name || 'Project Name Not Available'}</h1>
        <p className={classes.ngoName}>by {projectData.ngoName || 'NGO Name Not Available'}</p>
        <p className={classes.projectDescription}>{projectData.description || 'No description provided.'}</p>
      </div>

      <div className={classes.mainContentGrid}>
        <div className={classes.transactionsPanel}>
          {/* ... (transactions display - existing) ... */}
          <div className={classes.panelHeader}>
            <h2>Recent Donations</h2>
            {isLoadingTx && !transactions.length && <FiLoader className={classes.txLoadingSpinner} />}
          </div>
          {txError && <p className={classes.txErrorMessage}><FiAlertCircle/> {txError}</p>}
          {!isLoadingTx && transactions.length === 0 && !txError && <p className={classes.noTransactions}>No recent donations.</p>}
          <ul className={classes.transactionList}>
            {transactions.map((tx, index) => (
              <li key={tx.hash || index} className={classes.transactionItem}>
                {/* <img src={tx.avatarUrl} alt={tx.name} className={classes.txAvatar} /> */}
                <div className={classes.txInfo}>
                  <span className={classes.txName}>{tx.name}</span>
                  <span className={classes.txEmail}>{tx.email}</span>
                </div>
                <span className={classes.txAmount}>{tx.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={classes.milestonesPanel}>
          <div className={classes.panelHeader}>
            <h2>Project Milestones</h2>
            {/* Add button to request advancement */}
            <button
              onClick={handleRequestMilestoneAdvancement}
              disabled={advancingMilestones || isLoadingMilestones}
              className={classes.advanceButton} // Add a class for styling
            >
              {advancingMilestones ? (
                <FiLoader className={classes.spinner} />
              ) : (
                <FiArrowRightCircle style={{ marginRight: '5px' }} />
              )}
              Advance Next Milestone (Simulate)
            </button>
          </div>
          {isLoadingMilestones && milestones.length === 0 && <FiLoader className={classes.spinner} /> }
          {milestonesError && <p className={classes.errorMessage}><FiAlertCircle/> {milestonesError}</p>}
          
          <ul className={classes.milestoneList}>
            {/* Display milestones fetched from the backend (these have dynamic statuses) */}
            {milestones.length > 0 ? (
              milestones.map((milestone) => (
                <li key={milestone.id}
                    className={`${classes.milestoneItem} ${classes[(milestone.status || 'pending').toLowerCase().replace(' ', '')]}`}>
                  {getMilestoneStatusIcon(milestone.status)}
                  <div className={classes.milestoneInfo}>
                    <h3 className={classes.milestoneTitle}>{milestone.name}</h3>
                    {milestone.description && <p className={classes.milestoneDetails}>{milestone.description}</p>}
                    {/* If Firestore milestones have amount, display it. The polled status won't have it unless backend includes it. */}
                    {projectData.milestones?.find(fm => fm.id === milestone.id || fm.name === milestone.name)?.amount && (
                        <p className={classes.milestoneAmount}>
                            Target: {projectData.milestones.find(fm => fm.id === milestone.id || fm.name === milestone.name).amount} XRP
                        </p>
                    )}
                    <p className={classes.milestoneStatusText}>Status: {milestone.status || 'Pending'}</p>
                  </div>
                </li>
              ))
            ) : !isLoadingMilestones && !milestonesError ? (
              <p>No milestones to display or yet to load.</p>
            ) : null}
            {/* Fallback to Firestore milestones if API fails or for initial render (optional) */}
            {milestones.length === 0 && !isLoadingMilestones && projectData.milestones && projectData.milestones.length > 0 && !milestonesError && (
                 projectData.milestones.map((milestone, index) => (
                    <li key={milestone.id || milestone.name || index}
                        className={`${classes.milestoneItem} ${classes[(milestone.status || 'pending').toLowerCase().replace(' ', '')]}`}>
                      {getMilestoneStatusIcon(milestone.status)} {/* This status would be from Firestore */}
                      <div className={classes.milestoneInfo}>
                        <h3 className={classes.milestoneTitle}>{milestone.name || 'Milestone Title'}</h3>
                        {milestone.description && <p className={classes.milestoneDetails}>{milestone.description}</p>}
                        {milestone.amount && <p className={classes.milestoneAmount}>Target: {milestone.amount} XRP</p>}
                        <p className={classes.milestoneStatusText}>Status: {milestone.status || 'Pending'}</p>
                      </div>
                    </li>
                 ))
            )}
          </ul>
          <div className={classes.donate}>
            <button onClick={handleSendPayment} disabled={!projectData.xrpl_wallet}>
              <FiDollarSign /> Donate to Cause
            </button>
            {!projectData.xrpl_wallet && <p style={{fontSize: '0.8em', color: 'gray'}}>Donations unavailable.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDisplayPage;