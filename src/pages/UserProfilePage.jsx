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

  // Effect to populate form when currentUserProfile is available or changes
  useEffect(() => {
    if (currentUserProfile) {
      setFormData({
        displayName: currentUserProfile.displayName || '',
        phone: currentUserProfile.phone || '',
        unitNo: currentUserProfile.defaultAddress?.unitNo || '',
        address: currentUserProfile.defaultAddress?.address || '',
        area: currentUserProfile.defaultAddress?.area || '',
        preferredPaymentMethodId: currentUserProfile.preferredPaymentMethodId || '',
        preferredDeliveryTypeId: currentUserProfile.preferredDeliveryTypeId || '',
      });
      setInitialProfileLoading(false); // Profile data is now loaded into form
    } else if (!loadingAuth && currentUser) {
        // If auth is loaded, user exists, but profile is null, it means fetchUserProfile didn't find/set it
        // or it's still in progress from AuthContext.
        // AuthContext should ideally handle the initial fetchUserProfile call.
        // We can set initialProfileLoading to false here too if we assume AuthContext has tried.
        setInitialProfileLoading(false);
    }
  }, [currentUserProfile, loadingAuth, currentUser]);

  // Effect to fetch app settings (for dropdowns)
  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAppSettings();
      if (settings) {
        setAppSettings({
            paymentMethods: settings.paymentMethods || [],
            deliveryOptions: settings.deliveryOptions || []
        });
      }
    };
    fetchSettings();
  }, []);

  // Callback to fetch user orders
  const fetchUserOrders = useCallback(async () => {
    if (!currentUser?.uid) {
      setLoadingOrders(false); // No user, no orders to load
      return;
    }
    setLoadingOrders(true);
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserOrders(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      // Optionally set an error state to display to the user
    }
    setLoadingOrders(false);
  }, [currentUser?.uid]);

  // Effect to fetch orders when component mounts or user changes
  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]); // fetchUserOrders is memoized by useCallback

  const handleInputChange = (e) => {
    const { name, value } = e.target; // Removed type, checked as not used in this form
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    setLoadingProfileSave(true); // Use specific loading state for save operation
    const userRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        defaultAddress: {
          unitNo: formData.unitNo,
          address: formData.address,
          area: formData.area,
        },
        preferredPaymentMethodId: formData.preferredPaymentMethodId,
        preferredDeliveryTypeId: formData.preferredDeliveryTypeId,
      });
      await fetchUserProfile(currentUser.uid); // Refresh profile in context (AuthContext should update currentUserProfile)
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
    setLoadingProfileSave(false);
  };

  // --- UPDATED LOADING CONDITION ---
  if (loadingAuth || initialProfileLoading) { // Wait for auth and initial profile data to be processed
    return <p className={classes.loadingText}>Loading profile...</p>;
  }

  if (!currentUser) { // Should be caught by ProtectedRoute, but as a safeguard
      return <p className={classes.loadingText}>Please log in to view your profile.</p>;
  }
  // By this point, currentUser exists, and initialProfileLoading is false.
  // currentUserProfile might still be null if no profile doc exists for the user.

  return (
    <div className={classes.pageContainer}>
      <h2 className={classes.pageTitle}>My Profile & Preferences</h2>

      {/* Profile Information and Edit Form */}
      <div className={classes.section}>
        <h3 className={classes.sectionTitle}>Personal Information</h3>
        {!isEditing ? (
          <>
            <div className={classes.infoGrid}>
              <p><strong>Name:</strong></p><p>{currentUserProfile?.displayName || formData.displayName || 'Not set'}</p>
              <p><strong>Email:</strong></p><p>{currentUser?.email}</p>
              <p><strong>Phone:</strong></p><p>{currentUserProfile?.phone || formData.phone || 'Not set'}</p>
              <p><strong>Wallet Address:</strong></p>
              <p>
                {expanded ? currentUserProfile?.xrplAddress : getShortAddress(currentUserProfile?.xrplAddress)}
                {currentUserProfile?.xrplAddress && currentUserProfile?.xrplAddress.length > 12 && (
                  <button 
                    onClick={() => setExpanded(!expanded)} 
                    style={{ marginLeft: '10px', cursor: 'pointer', border: 'none', background: 'none', color: 'blue' }}
                  >
                    {expanded ? 'Hide' : 'Show full'}
                  </button>
                )}
              </p>            
            </div>
            <button onClick={() => setIsEditing(true)} className={`${classes.button} ${classes.editButton}`}>Edit Profile</button>
          </>
        ) : (
          <form onSubmit={handleProfileUpdate}>
            <div className={classes.formGroup}>
              <label className={classes.label}>Name:</label>
              <input className={classes.input} type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} />
            </div>
            <div className={classes.formGroup}>
              <label className={classes.label}>Phone:</label>
              <input className={classes.input} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            {/* Section for Address and Preferences within the same form when editing */}
            <h3 className={classes.sectionTitle} style={{marginTop: '20px'}}>My Preferences</h3>
            <div className={classes.formGroup}>
                <label className={classes.label}>Default Unit No:</label>
                <input className={classes.input} type="text" name="unitNo" value={formData.unitNo} onChange={handleInputChange} />
            </div>
            <div className={classes.formGroup}>
                <label className={classes.label}>Default Address:</label>
                <input className={classes.input} type="text" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className={classes.formGroup}>
                <label className={classes.label}>Default Area:</label>
                <input className={classes.input} type="text" name="area" value={formData.area} onChange={handleInputChange} />
            </div>
            <div className={classes.formGroup}>
                <label className={classes.label}>Preferred Payment:</label>
                <select className={classes.select} name="preferredPaymentMethodId" value={formData.preferredPaymentMethodId} onChange={handleInputChange}>
                    <option value="">Select Preferred Payment</option>
                    {appSettings.paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                </select>
            </div>
            <div className={classes.formGroup}>
                <label className={classes.label}>Preferred Delivery:</label>
                <select className={classes.select} name="preferredDeliveryTypeId" value={formData.preferredDeliveryTypeId} onChange={handleInputChange}>
                    <option value="">Select Preferred Delivery</option>
                    {appSettings.deliveryOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <button type="submit" disabled={loadingProfileSave} className={`${classes.button} ${classes.saveButton}`}>
              {loadingProfileSave ? 'Saving...' : 'Save All Changes'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={`${classes.button} ${classes.cancelButton}`}>
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Display Preferences when not editing */}
      {!isEditing && currentUserProfile && (
           <div className={classes.section}>
                <h3 className={classes.sectionTitle}>My Preferences</h3>
                 <div className={classes.infoGrid}>
                    <p><strong>Default Address:</strong></p><p>{`${currentUserProfile.defaultAddress?.unitNo || ''} ${currentUserProfile.defaultAddress?.address || ''}${currentUserProfile.defaultAddress?.area ? ', ' + currentUserProfile.defaultAddress.area : ''}` || 'Not set'}</p>
                    <p><strong>Preferred Payment:</strong></p><p>{(appSettings.paymentMethods.find(pm => pm.id === currentUserProfile.preferredPaymentMethodId)?.name) || 'Not set'}</p>
                    <p><strong>Preferred Delivery:</strong></p><p>{(appSettings.deliveryOptions.find(d => d.id === currentUserProfile.preferredDeliveryTypeId)?.name) || 'Not set'}</p>
                </div>
           </div>
      )}
    </div>
  );
};

export default UserProfile;