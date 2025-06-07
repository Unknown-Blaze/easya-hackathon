// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, NavLink, useNavigate, Navigate } from 'react-router-dom'; // Added NavLink for active styling

import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserLoginPage from './pages/UserLoginPage';
import SignupPage from './pages/SignUpPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminEditOrderPage from './pages/AdminEditOrderPage';
// import ProtectedRoute from './components/Admin/ProtectedRoute'; // Assuming you have this generic one
import { usePageTracking } from './utils/analytics'; // Adjust path if needed

// --- DEFINE YOUR ADMIN'S UID HERE ---
// You can get this from Firebase Authentication console after creating the admin user.
// For better security, this could be stored in an environment variable,
// but for simplicity now, we'll define it here.
const ADMIN_UID = "0KdTIOR7cwd7fMKK805Ojt2tnBP2"; // <<<< REPLACE THIS

const navStyles = {
  nav: {
    backgroundColor: '#ffffff', // White background
    padding: '12px 25px',      // Adjusted padding
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e9ecef', // Lighter border
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)', // Subtle shadow
    flexWrap: 'wrap',
    position: 'sticky', // Make navbar sticky
    top: 0,
    zIndex: 1010, // Ensure it's above other content
  },
  brandLink: { // For the main "Mango Shop" link
    textDecoration: 'none',
    color: '#FF9800', // Mango Orange for brand
    fontWeight: 'bold',
    fontSize: '1.5em', // Larger brand name
    fontFamily: "'Pacifico', cursive", // Example of a nice display font (add to index.html or global CSS)
  },
  navLinksContainer: { // To group main navigation links
    display: 'flex',
    alignItems: 'center',
    gap: '20px', // Space between links
  },
  link: {
    textDecoration: 'none',
    color: '#495057', // Dark grey for links
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    fontSize: '1em',
  },
  activeLink: { // This style will be applied by NavLink's isActive prop
    backgroundColor: '#FF9800',
    color: 'white',
  },
  logoutButton: {
    background: 'none',
    border: '1px solid #FF9800',
    color: '#FF9800',
    cursor: 'pointer',
    fontWeight: '500',
    padding: '7px 15px',
    borderRadius: '4px',
    fontSize: '0.95em',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },
  logoutButtonHover: { // For JS hover if needed, CSS :hover is better
    backgroundColor: '#FF9800',
    color: 'white',
  }
};

// Create a new component to call usePageTracking
// This component will be rendered inside <Router>
function PageTracker() {
  usePageTracking();
  return null; // This component doesn't render anything itself
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
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
      alert("Logout failed.");
    }
  };

  const goToOrder = () => navigate(`/`);

  const isAdmin = true;

  let name = currentUserProfile?.displayName
    ? currentUserProfile.displayName + "'s Profile"
    : "Your Profile";

  return (
    <>
      <nav style={navStyles.nav}>
        <RouterLink to="/" style={navStyles.brandLink}>
          Mango Club - Order
        </RouterLink>
        <button
          onClick={goToOrder}
          style={navStyles.logoutButton}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = navStyles.logoutButtonHover.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          Order
        </button>
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
                {name}
              </NavLink>
              <button
                onClick={handleLogout}
                style={navStyles.logoutButton}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    navStyles.logoutButtonHover.backgroundColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
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
                Sign Up
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
          element={
              <UserProfilePage />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
              <AdminDashboardPage />
          }
        />
        <Route
          path="/admin/order/:orderId"
          element={
              <AdminEditOrderPage />
          }
        />
      </Routes>
    </>
  );
}
