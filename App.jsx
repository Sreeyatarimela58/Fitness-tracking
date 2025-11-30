import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
// CSS is imported in index.html to avoid ESM loading issues

import Layout from './components/Layout';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Report from './pages/Report';
import { isAuthenticated, getProfile } from './services/storage';


// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  const [profile, setProfile] = useState(undefined); // undefined means loading

  useEffect(() => {
    const fetchProfile = async () => {
      const p = await getProfile();
      setProfile(p);
    };
    if (isAuth) {
      fetchProfile();
    } else {
      setProfile(undefined);
    }
  }, [isAuth]);

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (profile === undefined) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If authenticated but no profile, force profile setup (unless we are already there)
  if (!profile && window.location.hash !== '#/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

// Helper to redirect logged-in users away from login page
const LoginCheck = () => {
  const isAuth = isAuthenticated();
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    const fetchProfile = async () => {
      const p = await getProfile();
      setProfile(p);
    };
    if (isAuth) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuth]);

  if (isAuth) {
    if (profile === undefined) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (profile) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/setup" replace />;
  }
  return <Login />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginCheck />} />
        <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><Workouts /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
      {/* @ts-ignore */}
      <ToastContainer position="bottom-right" theme="colored" />
    </HashRouter>
  );
};

export default App;