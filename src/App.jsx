// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, NavLink, useNavigate, Navigate } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserLoginPage from './pages/UserLoginPage';
import SignupPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminEditOrderPage from './pages/AdminEditOrderPage'; // Consider renaming if "order" changes context
import { usePageTracking } from './utils/analytics';

// IMPORTANT: For better security, ADMIN_UID should be stored in an environment variable.
const ADMIN_UID = "0KdTIOR7cwd7fMKK805Ojt2tnBP2"; // <<<< REPLACE THIS with your actual Admin UID

const navStyles = {
  nav: {
    backgroundColor: '#FFFFFF', // White background
    padding: '15px 30px',      // Adjusted padding
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0', // Lighter border
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', // Subtle shadow
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    zIndex: 1020, // Ensure it's above other content
    height: '70px', // Fixed height for consistent layout
    fontFamily: "'Open Sans', sans-serif",
  },
  brandLink: {
    textDecoration: 'none',
    color: '#0A2E36', // Deep Teal for brand
    fontWeight: 'bold',
    fontSize: '1.8em', // Larger brand name
    fontFamily: "'Montserrat', sans-serif", // Brand font
  },
  navLinksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px', // Space between links
  },
  link: {
    textDecoration: 'none',
    color: '#333333', // Dark Gray for links
    fontWeight: '500',
    padding: '8px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontSize: '1em',
  },
  activeLink: {
    backgroundColor: '#007C8A', // Bright Teal for active link
    color: 'white',
  },
  authButton: { // Unified style for login/logout/signup buttons in nav
    background: 'transparent',
    border: '1px solid #007C8A', // Bright Teal border
    color: '#007C8A', // Bright Teal text
    cursor: 'pointer',
    fontWeight: '500',
    padding: '8px 18px',
    borderRadius: '4px',
    fontSize: '0.95em',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    marginLeft: '10px', // If it's the last item on the right
  },
  authButtonHover: {
    backgroundColor: '#007C8A',
    color: 'white',
  }
};

function PageTracker() {
  usePageTracking();
  return null;
}

export default function App() {
  return (
    <Router>
      <PageTracker />
      <AppLayout />
    </Router>
  );
}

function AppLayout() {
  const { currentUser, logout, currentUserProfile } = useAuth();
  // const navigate = useNavigate(); // Not used directly in this simplified nav

  const handleLogout = async () => {
    try {
      await logout();
      // navigate('/'); // Optional: redirect to home after logout
    } catch (error) {
      console.error("Failed to log out", error);
      alert("Logout failed. Please try again.");
    }
  };

  const profileName = currentUserProfile?.displayName
    ? `${currentUserProfile.displayName}'s Profile`
    : "My Profile";

  return (
    <>
      <nav style={navStyles.nav}>
        <RouterLink to="/" style={navStyles.brandLink}>
          nGoDONATE
        </RouterLink>

        <div style={navStyles.navLinksContainer}>
          {currentUser ? (
            <>
              <NavLink
                to="/profile"
                style={({ isActive }) =>
                  isActive
                    ? { ...navStyles.link, ...navStyles.activeLink }
                    : navStyles.link
                }
              >
                {profileName}
              </NavLink>
              <button
                onClick={handleLogout}
                style={navStyles.authButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = navStyles.authButtonHover.backgroundColor;
                  e.currentTarget.style.color = navStyles.authButtonHover.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = navStyles.authButton.color;
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                style={({ isActive }) =>
                  isActive
                    ? { ...navStyles.link, ...navStyles.activeLink }
                    : navStyles.link
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                style={({ isActive }) => ({
                  ...navStyles.link,
                  ...(isActive ? navStyles.activeLink : {}),
                  // Special style for Sign Up to make it stand out more like a CTA
                  // backgroundColor: isActive ? navStyles.activeLink.backgroundColor : '#007C8A',
                  // color: 'white',
                  // border: `1px solid ${isActive ? navStyles.activeLink.backgroundColor : '#007C8A'}`
                })}
              >
                 {({ isActive }) => (
                    <span style={{
                        ...navStyles.link,
                        ...(isActive ? navStyles.activeLink : {}),
                        backgroundColor: isActive ? navStyles.activeLink.backgroundColor : '#007C8A', // Bright Teal
                        color: 'white',
                        padding: '8px 18px' // Match authButton padding
                    }}>
                      Register
                    </span>
                 )}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<UserLoginPage />} />
        <Route
          path="/profile"
          element={currentUser ? <UserProfilePage /> : <Navigate to="/login" replace />}
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={currentUser?.uid === ADMIN_UID ? <AdminDashboardPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/order/:orderId" // TODO: Rename to /admin/project/:projectId or similar
          element={currentUser?.uid === ADMIN_UID ? <AdminEditOrderPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} /> {/* Catch-all redirects to home */}
      </Routes>
    </>
  );
}