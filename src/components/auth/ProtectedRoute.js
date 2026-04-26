// src/components/auth/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Requires auth
export const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

// Requires auth + ranch membership
export const RanchRoute = ({ children }) => {
  const { currentUser, ranchId } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!ranchId) return <Navigate to="/onboarding" replace />;
  return children;
};

// Requires auth + admin role
export const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, ranchId } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!ranchId) return <Navigate to="/onboarding" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};
