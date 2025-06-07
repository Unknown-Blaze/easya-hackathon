// src/pages/ProjectDisplayPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // To get projectId from URL eventually
import { FiDollarSign, FiCheckCircle, FiClock, FiLoader, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import classes from './ProjectDisplayPage.module.css'; // We'll create this CSS module

// Mock data for now
const MOCK_PROJECT_DETAILS = {
  '1': {
    name: "Clean Water Initiative - Rural Village A",
    ngoName: "AquaHope Foundation",
    description: "Providing access to clean and safe drinking water by installing a new well and filtration system for 500 residents.",
    milestones: [
      { id: 'm1', title: "Secure Funding & Permits", status: "Completed", details: "All necessary funds raised and government permits obtained." },
      { id: 'm2', title: "Site Survey & Preparation", status: "Completed", details: "Geological survey completed, site cleared for drilling." },
      { id: 'm3', title: "Well Drilling & Pump Installation", status: "In Progress", details: "Drilling commenced, expected completion by end of next week." },
      { id: 'm4', title: "Filtration System Setup", status: "Pending", details: "Equipment ordered, awaiting delivery." },
      { id: 'm5', title: "Community Training & Handover", status: "Pending", details: "Training materials being prepared." },
    ]
  },
  '2': {
    name: "School Supplies for Underprivileged Children",
    ngoName: "LearnForward Org",
    description: "Equipping 200 children from low-income families with essential school supplies for the academic year.",
    milestones: [
      { id: 'm1', title: "Fundraising Campaign", status: "Completed" },
      { id: 'm2', title: "Procurement of Supplies", status: "In Progress" },
      { id: 'm3', title: "Distribution Event Planning", status: "Pending" },
      { id: 'm4', title: "Supply Distribution", status: "Pending" },
    ]
  }
};

// Your FastAPI endpoint for transactions
const LATEST_TRANSACTIONS_ENDPOINT = 'http://127.0.0.1:8000/transaction/latest-transactions';


const ProjectDisplayPage = () => {
  const { projectId } = useParams(); // Example: if using React Router: /projects/:projectId
  const project = MOCK_PROJECT_DETAILS[projectId || '1']; // Default to project '1' if no ID

  const [transactions, setTransactions] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);

  const fetchTransactions = useCallback(async (isInitialFetch = false) => {
    if (!isInitialFetch && isLoadingTx) return; // Prevent multiple concurrent fetches during polling

    setIsLoadingTx(true);
    setTxError(null);
    const url = new URL(LATEST_TRANSACTIONS_ENDPOINT);
    // Only append last_tx_hash if it exists AND it's not the very first fetch
    if (lastTxHash && !isInitialFetch) {
      url.searchParams.append('latest_tx_hash', lastTxHash);
    }

    try {
      console.log(`Fetching transactions from: ${url.toString()}`);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP error! Status: ${res.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Received transactions data:", data);

      // The FastAPI endpoint returns the *new* transactions or *all* on first call.
      // The structure of 'data' from your FastAPI is directly the list of transactions.
      const newTxs = data; // Assuming data is directly the array of transactions

      if (newTxs && newTxs.length > 0) {
        // The structure of each transaction object (tx) from XRPL needs careful handling.
        // Common fields: tx.TransactionType, tx.Account, tx.Destination, tx.Amount (if Payment)
        // tx.hash or tx.tx.hash or tx.transaction.hash for the hash.
        // tx.meta.delivered_amount for actual delivered amount (for XRP, or for tokens if complex)

        const formattedTxs = newTxs.map(txData => {
          // Adjust this mapping based on the actual structure of txData from your API
          const tx = txData.tx || txData.transaction || txData; // Common ways XRPL tx data is nested
          const meta = txData.meta || {};

          let amount = 'N/A';
          if (tx.TransactionType === "Payment") {
            if (typeof tx.Amount === 'string') { // XRP amount in drops
              amount = `${parseFloat(tx.Amount) / 1000000} XRP`;
            } else if (typeof tx.Amount === 'object') { // Issued currency
              amount = `${tx.Amount.value} ${tx.Amount.currency}`;
            }
          }
          // For delivered amount (often more accurate for cross-currency or partial payments)
          if (meta.delivered_amount) {
             if (typeof meta.delivered_amount === 'string') {
                amount = `${parseFloat(meta.delivered_amount) / 1000000} XRP (Delivered)`;
             } else if (typeof meta.delivered_amount === 'object') {
                amount = `${meta.delivered_amount.value} ${meta.delivered_amount.currency} (Delivered)`;
             }
          }


          return {
            // IMPORTANT: Adjust these field accesses based on your actual XRPL transaction object structure
            hash: txData.hash || tx.hash, // Prefer top-level hash if available from your API modification
            type: tx.TransactionType || 'Unknown',
            account: tx.Account || 'Unknown Source',
            destination: tx.Destination || 'Unknown Destination',
            amount: amount,
            // For display, if you want a "name" instead of address, you'd need a mapping
            // For now, we'll show part of the source account for "name"
            name: tx.Account ? `User (${tx.Account.substring(0, 5)}...${tx.Account.substring(tx.Account.length - 5)})` : 'Anonymous Donor',
            email: tx.TransactionType === "Payment" ? `To: ${ (tx.Destination || 'Project Wallet').substring(0, 8) }...` : 'Blockchain Interaction',
            timestamp: tx.date ? new Date( (tx.date + 946684800) * 1000).toLocaleString() : new Date().toLocaleString(), // XRPL date is seconds since Jan 1, 2000
            avatarUrl: `https://i.pravatar.cc/40?u=${tx.Account || Math.random()}` // Placeholder avatar
          };
        }).filter(Boolean); // Filter out any malformed entries if parsing fails

        if (isInitialFetch) {
          setTransactions(formattedTxs.slice(0, 5)); // Show latest 5 on initial
        } else {
          // Prepend new transactions and keep the list at a max of 5
          setTransactions(prevTxs => [...formattedTxs, ...prevTxs].slice(0, 5));
        }
        
        // Update lastTxHash with the hash of the newest transaction from this batch
        // Your FastAPI endpoint returns newest first if `forward=False`
        if (formattedTxs.length > 0) {
            setLastTxHash(formattedTxs[0].hash);
        }
      } else if (isInitialFetch) {
        setTransactions([]); // No transactions found on initial fetch
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTxError(error.message || "Failed to fetch transactions.");
      // Don't clear transactions on poll error, keep showing old ones
    } finally {
      setIsLoadingTx(false);
    }
  }, [lastTxHash, isLoadingTx]); // Add isLoadingTx to dependencies to avoid re-triggering while already loading

  // Initial fetch
  useEffect(() => {
    fetchTransactions(true);
  }, [projectId]); // Re-fetch if projectId changes

  // Polling
  useEffect(() => {
    const intervalId = setInterval(() => {
        console.log("Polling for new transactions...");
        fetchTransactions(false); // Pass false for subsequent polls
    }, 10000); // Poll every 10 seconds (adjust as needed)

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchTransactions]); // Depend on fetchTransactions (which depends on lastTxHash)

  if (!project) {
    return <div className={classes.pageContainer}><p>Project not found.</p></div>;
  }

  const getMilestoneStatusIcon = (status) => {
    if (status === "Completed") return <FiCheckCircle className={`${classes.milestoneIcon} ${classes.completed}`} />;
    if (status === "In Progress") return <FiLoader className={`${classes.milestoneIcon} ${classes.inProgress} ${classes.spinner}`} />;
    return <FiClock className={`${classes.milestoneIcon} ${classes.pending}`} />;
  };

  return (
    <div className={classes.pageContainer}>
      <div className={classes.projectHeader}>
        <h1>{project.name}</h1>
        <p className={classes.ngoName}>by {project.ngoName}</p>
        <p className={classes.projectDescription}>{project.description}</p>
      </div>

      <div className={classes.mainContentGrid}>
        {/* Left Column: Latest Transactions */}
        <div className={classes.transactionsPanel}>
          <div className={classes.panelHeader}>
            <h2>Recent Donations</h2>
            {/* <a href="#" className={classes.viewAllLink}>View all</a> */}
            {isLoadingTx && !transactions.length && <FiLoader className={classes.txLoadingSpinner} />}
          </div>
          {txError && <p className={classes.txErrorMessage}><FiAlertCircle/> {txError}</p>}
          {!isLoadingTx && transactions.length === 0 && !txError && <p className={classes.noTransactions}>No recent donations to display.</p>}
          
          <ul className={classes.transactionList}>
            {transactions.map((tx, index) => (
              <li key={tx.hash || index} className={classes.transactionItem}>
                <img src={tx.avatarUrl} alt={tx.name} className={classes.txAvatar} />
                <div className={classes.txInfo}>
                  <span className={classes.txName}>{tx.name}</span>
                  <span className={classes.txEmail}>{tx.email}</span> {/* Or tx.type / short description */}
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
            {project.milestones.map(milestone => (
              <li key={milestone.id} className={`${classes.milestoneItem} ${classes[milestone.status.toLowerCase().replace(' ', '')]}`}>
                {getMilestoneStatusIcon(milestone.status)}
                <div className={classes.milestoneInfo}>
                  <h3 className={classes.milestoneTitle}>{milestone.title}</h3>
                  <p className={classes.milestoneStatusText}>Status: {milestone.status}</p>
                  {milestone.details && <p className={classes.milestoneDetails}>{milestone.details}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectDisplayPage;