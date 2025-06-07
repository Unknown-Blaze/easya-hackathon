// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const WALLET_API_BASE_URL = 'http://127.0.0.1:8000';
const CREATE_WALLET_ENDPOINT = `${WALLET_API_BASE_URL}/wallet/create`;

const MAX_WALLET_RETRIES = 3; // Max number of retries for wallet creation
const RETRY_DELAY_MS = 2000; // Delay between retries (e.g., 2 seconds)

// Helper function for retrying promises
async function retryPromise(promiseFn, maxRetries, delayMs, attempt = 1) {
  try {
    return await promiseFn();
  } catch (error) {
    console.warn(`Attempt ${attempt} failed: ${error.message}`);
    // Check for specific retryable error (e.g., network error, 503)
    // For simplicity, we'll retry on any error here, but you might want to be more specific.
    // Example: if (error.message.includes("503") || error.name === 'TypeError')
    if (attempt < maxRetries) {
      console.log(`Retrying in ${delayMs / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return retryPromise(promiseFn, maxRetries, delayMs, attempt + 1);
    } else {
      console.error(`All ${maxRetries} retries failed.`);
      throw error; // Re-throw the last error
    }
  }
}


async function createXrplWalletApiInternal() { // Renamed to avoid conflict if used elsewhere
  console.log(`Attempting to create XRPL wallet via API: ${CREATE_WALLET_ENDPOINT}`);
  const response = await fetch(CREATE_WALLET_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    // Special handling for 503 to make it more clearly a "retryable" error type if needed by retryPromise
    if (response.status === 503) {
        const serviceUnavailableError = new Error(`Wallet service unavailable (503).`);
        serviceUnavailableError.isRetryable = true; // Custom flag
        throw serviceUnavailableError;
    }
    const errorData = await response.json().catch(() => ({
      detail: `Wallet creation API request failed with status: ${response.status}`
    }));
    console.error("Wallet API Error Response:", errorData);
    throw new Error(errorData.detail || `Wallet API request failed`);
  }
  const data = await response.json();
  if (!data.wallet || !data.wallet.address || !data.wallet.seed) {
    console.error("Invalid wallet data received from API:", data);
    throw new Error("Invalid wallet data received from API.");
  }
  console.log("XRPL Wallet created via API (address and seed received):", data.wallet.address);
  return data.wallet;
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState(null); // For signup steps

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  };

  const signup = async (email, password, displayName, additionalData = {}, 
                        // Callback for UI updates during long operations
                        onStepChange = (message) => console.log(message) 
                       ) => {
    let createdSeed = null;
    let user = null; // To hold the auth user object

    try {
      onStepChange("Creating your account...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user; // Assign here

      onStepChange("Updating profile...");
      await updateProfile(user, { displayName: displayName });

      onStepChange("Generating your secure XRPL wallet (this may take a moment)...");
      let xrplAddress = null;
      try {
        // Use the retryPromise helper for wallet creation
        const createdWallet = await retryPromise(
            () => createXrplWalletApiInternal(), // Pass the actual API call function
            MAX_WALLET_RETRIES,
            RETRY_DELAY_MS
        );
        xrplAddress = createdWallet.address;
        createdSeed = createdWallet.seed;
        console.log("Wallet created, address:", xrplAddress, "SEED WILL BE RETURNED TO UI.");
      } catch (walletError) {
        console.error("Failed to create XRPL wallet after retries:", walletError.message);
        // Critical failure: If wallet is mandatory, delete the Firebase Auth user.
        if (user) { // Check if user object exists
          onStepChange("Wallet creation failed. Cleaning up account...");
          await user.delete().catch(delErr => console.error("Failed to delete auth user after wallet error:", delErr));
          console.log("Firebase Auth user deleted due to wallet creation failure.");
        }
        throw new Error(`XRPL wallet generation failed: ${walletError.message}. Your account was not created. Please try again.`);
      }

      onStepChange("Saving your information...");
      const userRef = doc(db, "users", user.uid);
      const userProfileData = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: serverTimestamp(),
        phone: '',
        defaultAddress: { unitNo: '', address: '', area: '' },
        preferredPaymentMethodId: '',
        preferredDeliveryTypeId: '',
        ...additionalData,
        xrplAddress: xrplAddress,
      };
      await setDoc(userRef, userProfileData);

      onStepChange("Finalizing...");
      setCurrentUserProfile(userProfileData);
      setCurrentUser(user); // Ensure currentUser state is updated

      return { userCredential, seed: createdSeed };

    } catch (error) {
      console.error("Error in signup process:", error.message);
      // The error from wallet creation (if user was deleted) or Firebase auth error will be thrown
      throw error;
    } finally {
        onStepChange(null); // Clear loading message
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setCurrentUserProfile(null);
      return null;
    }
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const profileData = { uid: userId, ...docSnap.data() };
        setCurrentUserProfile(profileData);
        return profileData;
      } else {
        console.warn("No such user profile document for UID:", userId);
        setCurrentUserProfile(null); // Important to clear if no profile
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setCurrentUserProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state change detected. User:", user ? user.uid : 'null');
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      }
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    currentUserProfile,
    fetchUserProfile,
    login,
    signup,
    logout,
    loadingAuth,
    globalLoadingMessage, // Expose this for UI if needed, though SignupPage manages its own
    setGlobalLoadingMessage // Expose setter if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};