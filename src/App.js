// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, RanchRoute, AdminRoute } from "./components/auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";

// Auth pages
import { LoginPage, RegisterPage } from "./components/auth/AuthPages";
import { OnboardingPage } from "./components/auth/OnboardingPage";

// App pages
import { DashboardPage } from "./pages/DashboardPage";
import { AnimalsPage } from "./pages/AnimalsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { TodoPage } from "./pages/TodoPage";
import { BillingPage } from "./pages/BillingPage";
import { MembersPage } from "./pages/MembersPage";
import { RanchBoardPage } from "./pages/RanchBoardPage";
import { MyAnimalsPage } from "./pages/MyAnimalsPage";
import { MyBillingPage } from "./pages/MyBillingPage";
import { SettingsPage } from "./pages/SettingsPage";

import "./styles/global.css";

const Shell = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding (auth required, no ranch yet) */}
          <Route path="/onboarding" element={
            <ProtectedRoute><OnboardingPage /></ProtectedRoute>
          } />

          {/* Dashboard (auth + ranch) */}
          <Route path="/dashboard" element={
            <Shell><RanchRoute><DashboardPage /></RanchRoute></Shell>
          } />

          {/* ── Admin routes ─────────────────────────── */}
          <Route path="/animals" element={
            <Shell><AdminRoute><AnimalsPage /></AdminRoute></Shell>
          } />
          <Route path="/services" element={
            <Shell><AdminRoute><ServicesPage /></AdminRoute></Shell>
          } />
          <Route path="/todo" element={
            <Shell><AdminRoute><TodoPage /></AdminRoute></Shell>
          } />
          <Route path="/billing" element={
            <Shell><AdminRoute><BillingPage /></AdminRoute></Shell>
          } />
          <Route path="/members" element={
            <Shell><AdminRoute><MembersPage /></AdminRoute></Shell>
          } />

          {/* ── User routes ──────────────────────────── */}
          <Route path="/my-animals" element={
            <Shell><RanchRoute><MyAnimalsPage /></RanchRoute></Shell>
          } />
          <Route path="/ranch" element={
            <Shell><RanchRoute><RanchBoardPage /></RanchRoute></Shell>
          } />
          <Route path="/my-billing" element={
            <Shell><RanchRoute><MyBillingPage /></RanchRoute></Shell>
          } />

          {/* ── Shared routes ────────────────────────── */}
          <Route path="/settings" element={
            <Shell><ProtectedRoute><SettingsPage /></ProtectedRoute></Shell>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
