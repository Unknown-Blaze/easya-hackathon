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
import MintNFTPage from './pages/MintNFT';

// IMPORTANT: For better security, ADMIN_UID should be stored in an environment variable.
const ADMIN_UID = "0KdTIOR7cwd7fMKK805Ojt2tnBP2"; // <<<< REPLACE THIS with your actual Admin UID

const navStyles = {
  nav: {
    background: 'linear-gradient(90deg, #ffffff 70%, #e7f6fa 100%)', // subtle blue tint at the end
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 4px 16px rgba(0,124,138,0.05)', // a bit more shadow, with a blue tint
    flexWrap: 'wrap',
    position: 'sticky',
    top: 0,
    zIndex: 1020,
    height: '70px',
    fontFamily: "'Open Sans', sans-serif",
  },
  brandLink: {
    textDecoration: 'none',
    color: '#0A2E36',
    // fontWeight: 'bold',
    fontSize: '1.8em',
    fontFamily: 'Montserrat',
    position: 'relative',
    display: 'inline-block',
    transition: 'color 0.3s',
    background: 'linear-gradient(90deg, #0A2E36, #007C8A, #0A2E36)',
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  link: {
    textDecoration: 'none',
    color: '#333333',
    fontWeight: '500',
    padding: '8px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontSize: '1em',
    backgroundColor: 'transparent', // Default transparent
    fontFamily: 'Montserrat',
  },
  activeLink: {
    backgroundColor: '#007C8A', // Blue background when active
    color: 'white',
  },
  authButton: {
    background: 'transparent',
    border: '1px solid #007C8A',
    color: '#007C8A',
    cursor: 'pointer',
    fontWeight: '500',
    padding: '8px 18px',
    borderRadius: '4px',
    fontSize: '0.95em',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    marginLeft: '10px',
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
                style={({ isActive }) =>
                  isActive
                    ? { ...navStyles.link, ...navStyles.activeLink }
                    : navStyles.link
                }
              >
                Register
              </NavLink>
              <NavLink
                to="/nftPage"
                style={({ isActive }) =>
                  isActive
                    ? { ...navStyles.link, ...navStyles.activeLink }
                    : navStyles.link
                }
              >
                NFT Gallery
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<UserLoginPage />} />
        <Route path="/nftPage" element={<MintNFTPage />} />
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