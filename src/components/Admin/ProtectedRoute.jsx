// // src/components/Admin/ProtectedRoute.jsx
// import React from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { Navigate, Outlet } from 'react-router-dom';

// const ProtectedRoute = ({ children, redirectTo = "/login", adminOnly = false, adminUID = null }) => {
//   const { currentUser, loadingAuth } = useAuth();

//   if (loadingAuth) {
//     return <div>Loading authentication state...</div>; // Or a spinner
//   }

//   if (!currentUser) {
//     // Redirect to login, passing the intended location
//     return <Navigate to={redirectTo} state={{ from: location }} replace />;
//   }

//   if (!currentUser) {
//     // User not logged in, redirect to login page
//     return <Navigate to="/admin/login" replace />;
//   }

//   if (adminOnly) {
//     if (!adminUID || currentUser.uid !== adminUID) {
//       // Not the admin, or adminUID not configured
//       console.warn("Access denied to admin route for user:", currentUser.uid);
//       return <Navigate to="/" replace />; // Redirect non-admins to homepage
//     }
//   }

//   // User is logged in, render the requested component (or children)
//   return children ? children : <Outlet />;
// };

// export default ProtectedRoute;