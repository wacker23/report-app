// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./components/DB";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AddReport from "./components/AddReport";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let logoutTimer;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Start 1-hour timer
        logoutTimer = setTimeout(() => {
          signOut(auth).then(() => {
            alert("You have been logged out due to inactivity (1 hour).");
            window.location.href = "/";
          });
        }, 60 * 60 * 1000); // 1 hour in ms
      }
    });

    return () => {
      unsubscribe();
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-report"
          element={
            <ProtectedRoute>
              <AddReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
