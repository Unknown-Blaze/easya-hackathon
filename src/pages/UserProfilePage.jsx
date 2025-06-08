// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import styles from './UserProfile.module.css';

const MOCK_DONATIONS = [
    {
      "id": "donation1",
      "amount": 50,
      "receiverName": "Charity A",
      "timestamp": { "seconds": 1685846400 }
    },
    {
      "id": "donation2",
      "amount": 75,
      "receiverName": "Charity B",
      "timestamp": { "seconds": 1685760000 }
    },
    {
      "id": "donation3",
      "amount": 100,
      "receiverName": "Charity C",
      "timestamp": { "seconds": 1685673600 }
    },
    {
      "id": "donation4",
      "amount": 25,
      "receiverName": "Charity D",
      "timestamp": { "seconds": 1685587200 }
    },
    {
      "id": "donation5",
      "amount": 30,
      "receiverName": "Charity E",
      "timestamp": { "seconds": 1685500800 }
    },
    {
      "id": "donation6",
      "amount": 60,
      "receiverName": "Charity F",
      "timestamp": { "seconds": 1685414400 }
    },
    {
      "id": "donation7",
      "amount": 45,
      "receiverName": "Charity G",
      "timestamp": { "seconds": 1685328000 }
    },
    {
      "id": "donation8",
      "amount": 90,
      "receiverName": "Charity H",
      "timestamp": { "seconds": 1685241600 }
    },
    {
      "id": "donation9",
      "amount": 120,
      "receiverName": "Charity I",
      "timestamp": { "seconds": 1685155200 }
    },
    {
      "id": "donation10",
      "amount": 80,
      "receiverName": "Charity J",
      "timestamp": { "seconds": 1685068800 }
    }
  ]
  

const UserProfile = () => {
    const { currentUserProfile, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [formData, setFormData] = useState({ displayName: '' });
    const donations = MOCK_DONATIONS
    const [loadingDonations, setLoadingDonations] = useState(true);

    useEffect(() => {
        if (currentUserProfile) {
            setFormData({
                displayName: currentUserProfile.displayName || ''
            });
        }
    }, [currentUserProfile]);

    useEffect(() => {
        const loadDonations = async () => {
            setLoadingDonations(true);
            if (currentUserProfile && currentUserProfile.uid) {
                try {
                    const donationsRef = collection(db, 'donations');
                    const q = query(donationsRef, where('donorId', '==', currentUserProfile.uid), orderBy('timestamp', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const donationsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setDonations(donationsData);
                } catch (error) {
                    console.error('Error fetching donations:', error);
                } finally {
                    setLoadingDonations(false);
                }
            } else {
                setLoadingDonations(false);
            }
        };

        loadDonations();
    }, [currentUserProfile]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            if (currentUserProfile && currentUserProfile.uid) {
                await updateUserProfile(formData.displayName);
                const userDocRef = doc(db, 'users', currentUserProfile.uid);
                await updateDoc(userDocRef, {
                    displayName: formData.displayName,
                });
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleCancel = () => {
        setFormData({
            displayName: currentUserProfile?.displayName || ''
        });
        setIsEditing(false);
    };

    const getShortAddress = (addr) => {
        if (!addr) return 'Not set';
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}......${addr.slice(-6)}`;
    };

    return (
        <div className={styles.userProfileContainer}>
            <div className={styles.contentWrapper}>
                {/* Profile Information */}
                <div className={styles.profileSection}>
                    <div className={styles.titleContainer}>
                        <h3 className={styles.profileTitle}>Personal Information</h3>
                    </div>
                    {!isEditing ? (
                        <>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoItem}>
                                    <strong className={styles.infoLabel}>Name:</strong>
                                    <span className={styles.infoValue}>{currentUserProfile?.displayName || formData.displayName || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong className={styles.infoLabel}>Wallet Address:</strong>
                                    <span className={styles.infoValue}>
                                        {expanded ? currentUserProfile?.xrplAddress : getShortAddress(currentUserProfile?.xrplAddress)}
                                        {currentUserProfile?.xrplAddress && currentUserProfile?.xrplAddress.length > 12 && (
                                            <button
                                                onClick={() => setExpanded(!expanded)}
                                                className={styles.addressToggleButton}
                                            >
                                                {expanded ? 'Hide' : 'Show full'}
                                            </button>
                                        )}
                                    </span>
                                </div>
                            </div>
                            <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="displayName">Name:</label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button className={styles.saveButton} onClick={handleSave}>
                                    Save
                                </button>
                                <button className={styles.cancelButton} onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Donation History */}
                <div className={styles.donationsSection}>
                    <div className={styles.titleContainer}>
                        <h3 className={styles.donationsTitle}>Donation History</h3>
                    </div>
                    {loadingDonations ? (
                        <p>Loading donations...</p>
                    ) : donations.length > 0 ? (
                        <ul className={styles.donationsList}>
                            {donations.map(donation => (
                                <li key={donation.id} className={styles.donationItem}>
                                    <div><strong>Amount:</strong> {donation.amount} XRP</div>
                                    <div><strong>To:</strong> {donation.receiverName}</div>
                                    <div><strong>Date:</strong> {new Date(donation.timestamp?.seconds * 1000).toLocaleDateString()}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No donations found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;