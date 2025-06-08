// src/pages/ProjectDisplayPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiDollarSign, FiCheckCircle, FiClock, FiLoader, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import classes from './ProjectDisplayPage.module.css';
import { sendPayment } from '@gemwallet/api';

// Firestore imports
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config'; // Adjust path if necessary

// Remove or comment out MOCK_PROJECT_DETAILS
// const MOCK_PROJECT_DETAILS = { ... };

const LATEST_TRANSACTIONS_ENDPOINT = 'http://127.0.0.1:8000/transaction/latest-transactions';

const ProjectDisplayPage = () => {
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);

  // Fetch project details from Firestore
  useEffect(() => {
    const fetchProject = async () => {
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
          setProjectData({ id: docSnap.id, ...docSnap.data() });
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
  }, [projectId]); // Re-fetch if projectId changes

  // GemWallet payment handler
  async function handleSendPayment() {
    if (!projectData || !projectData.xrpl_wallet) {
      console.error('Project data or XRPL wallet address is missing.');
      alert('Cannot initiate payment: Project wallet address not found.');
      return;
    }

    const transaction = {
      destination: projectData.xrpl_wallet, // Use project's wallet address
      amount: '5', // Example amount in XRP - consider making this dynamic
    };

    try {
      const response = await sendPayment(transaction);
      if (response.status === 'success') {
        console.log('Transaction successful! Hash:', response.hash);
        alert(`Payment successful! Transaction Hash: ${response.hash}`);
        // Optionally, re-fetch transactions here or wait for polling
        fetchTransactions(true); // Force a refresh of transactions
      } else {
        console.error('Payment failed:', response.error || response.message);
        alert(`Payment failed: ${response.error || response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Unexpected error during payment:', error);
      alert(`An unexpected error occurred during payment: ${error.message}`);
    }
  }

  // Transaction fetching logic (mostly unchanged, but ensure it runs after project loads if dependent)
  const fetchTransactions = useCallback(async (isInitialFetch = false) => {
    if (!projectData) return; // Don't fetch transactions if project data isn't loaded
    if (!isInitialFetch && isLoadingTx) return;

    setIsLoadingTx(true);
    setTxError(null);
    const url = new URL(LATEST_TRANSACTIONS_ENDPOINT);
    if (lastTxHash && !isInitialFetch) {
      url.searchParams.append('latest_tx_hash', lastTxHash);
    }
    // You might want to pass the project's XRPL address to your backend
    // if transactions are specific to this project's wallet
    if (projectData && projectData.xrpl_wallet) {
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
            avatarUrl: `https://i.pravatar.cc/40?u=${tx.Account || Math.random()}`
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
  }, [lastTxHash, isLoadingTx, projectData]); // Added projectData dependency

  // Initial transaction fetch - depends on projectData
  useEffect(() => {
    if (projectData) { // Only fetch transactions once project data is available
        fetchTransactions(true);
    }
  }, [projectData, fetchTransactions]); // Rerun if projectData changes or fetchTransactions definition changes

  // Polling for transactions
  useEffect(() => {
    if (!projectData) return () => {}; // Don't start polling if no project data

    const intervalId = setInterval(() => {
        fetchTransactions(false); // Pass false for subsequent polls
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [fetchTransactions, projectData]); // Added projectData dependency


  // Milestone status icon helper
  const getMilestoneStatusIcon = (status) => {
    // Convert Firestore status (if exists) or use a default
    const currentStatus = status || "Pending"; // Default to pending if no status field
    if (currentStatus.toLowerCase() === "completed") return <FiCheckCircle className={`${classes.milestoneIcon} ${classes.completed}`} />;
    if (currentStatus.toLowerCase() === "in progress") return <FiLoader className={`${classes.milestoneIcon} ${classes.inProgress} ${classes.spinner}`} />;
    return <FiClock className={`${classes.milestoneIcon} ${classes.pending}`} />;
  };


  // Render logic
  if (loadingProject) {
    return <div className={classes.pageContainer} style={{ textAlign: 'center', paddingTop: '50px' }}><FiLoader className={classes.spinner} style={{ fontSize: '2em' }} /> <p>Loading project details...</p></div>;
  }

  if (projectError) {
    return <div className={classes.pageContainer} style={{ textAlign: 'center', paddingTop: '50px' }}><FiAlertCircle style={{ fontSize: '2em', color: 'red' }}/> <p>{projectError}</p></div>;
  }

  if (!projectData) {
    // This case should ideally be covered by projectError, but as a fallback:
    return <div className={classes.pageContainer}><p>Project information is unavailable.</p></div>;
  }

  // --- Main Render when projectData is available ---
  return (
    <div className={classes.pageContainer}>
      <div className={classes.projectHeader}>
        <h1>{projectData.name || 'Project Name Not Available'}</h1>
        {/* ngoName is not in your Firestore screenshot for the project document.
            You might need to add it or fetch it separately if it's tied to the user who created it.
            For now, I'll use a placeholder or assume it might be a field. */}
        <p className={classes.ngoName}>by {projectData.ngoName || 'Doctors without Borders'}</p>
        <p className={classes.projectDescription}>{projectData.description || 'No description provided.'}</p>
      </div>

      <div className={classes.mainContentGrid}>
        {/* Left Column: Latest Transactions */}
        <div className={classes.transactionsPanel}>
          <div className={classes.panelHeader}>
            <h2>Recent Donations</h2>
            {isLoadingTx && !transactions.length && <FiLoader className={classes.txLoadingSpinner} />}
          </div>
          {txError && <p className={classes.txErrorMessage}><FiAlertCircle/> {txError}</p>}
          {!isLoadingTx && transactions.length === 0 && !txError && <p className={classes.noTransactions}>No recent donations to display for this project.</p>}
          
          <ul className={classes.transactionList}>
            {transactions.map((tx, index) => (
              <li key={tx.hash || index} className={classes.transactionItem}>
                <div className={classes.txInfo}>
                  <span className={classes.txName}>{tx.name}</span>
                  <span className={classes.txEmail}>{tx.email}</span>
                </div>
                <span className={classes.txAmount}>{tx.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Milestones */}
        <div className={classes.milestonesPanel}>
          <div className={classes.panelHeader}>
            <h2>Project Milestones</h2>
          </div>
          <ul className={classes.milestoneList}>
            {projectData.milestones && projectData.milestones.length > 0 ? (
              projectData.milestones.map((milestone, index) => (
                // Assuming milestone objects in Firestore have 'name' and 'description'
                // and you might add 'status' and a unique 'id'
                <li key={milestone.id || milestone.name || index} // Use a proper unique id if available
                    className={`${classes.milestoneItem} ${classes[(milestone.status || 'pending').toLowerCase().replace(' ', '')]}`}>
                  {getMilestoneStatusIcon(milestone.status)}
                  <div className={classes.milestoneInfo}>
                    <h3 className={classes.milestoneTitle}>{milestone.name || 'Milestone Title'}</h3>
                    {/* The screenshot shows 'description' field for a milestone, let's use it */}
                    {milestone.description && <p className={classes.milestoneDetails}>{milestone.description}</p>}
                    {/* 'amount' and 'xrpl_wallet' are also in your milestone screenshot */}
                    {milestone.amount && <p className={classes.milestoneAmount}>Target: {milestone.amount} XRP (or relevant currency)</p>}
                    <p className={classes.milestoneStatusText}>Status: {milestone.status || 'Pending'}</p>
                  </div>
                </li>
              ))
            ) : (
              <p>No milestones defined for this project.</p>
            )}
          </ul>
          <div className={classes.donate}>
            <button onClick={handleSendPayment} disabled={!projectData.xrpl_wallet}>
              <FiDollarSign /> Donate to Cause
            </button>
            {!projectData.xrpl_wallet && <p style={{fontSize: '0.8em', color: 'gray'}}>Donations for this project are currently unavailable.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDisplayPage;