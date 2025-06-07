// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config'; // Import db as well
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // For signup
  signOut,
  updateProfile // To update Firebase Auth display name
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"; // For user profiles

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // NEW: Store user profile data
  const [loadingAuth, setLoadingAuth] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Update Firebase Auth profile
    await updateProfile(user, { displayName: displayName });
    // Create user document in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: serverTimestamp(),
      // Initialize other profile fields as empty or with defaults
      phone: '',
      defaultAddress: { unitNo: '', address: '', area: '' },
      preferredPaymentMethodId: '',
      preferredDeliveryTypeId: '',
    });
    return userCredential;
  };

  const logout = () => {
    setCurrentUserProfile(null); // Clear profile on logout
    return signOut(auth);
  };

  // Function to fetch user profile from Firestore
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setCurrentUserProfile(null);
      return null;
    }
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      setCurrentUserProfile({ uid: userId, ...docSnap.data() });
      return { uid: userId, ...docSnap.data() };
    } else {
      console.log("No such user profile document!");
      setCurrentUserProfile(null); // Or create a default one if it should always exist after auth
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid); // Fetch profile when auth state changes
      } else {
        setCurrentUserProfile(null); // Clear profile if no user
      }
      setLoadingAuth(false);
      console.log("Auth state changed, current user:", user ? user.uid : null);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    currentUserProfile, // Expose user profile
    fetchUserProfile,   // Expose function to refresh profile if needed
    login,
    signup,
    logout,
    loadingAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};