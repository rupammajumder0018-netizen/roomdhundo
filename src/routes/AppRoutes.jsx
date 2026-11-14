import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout.jsx";
import HomePage from "../pages/HomePage.jsx";
import SearchPage from "../pages/SearchPage.jsx";
import PropertyDetailsPage from "../pages/PropertyDetailsPage.jsx";
import PoliciesPage from "../pages/PoliciesPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

// Auth Pages
import LoginPage from "../pages/auth/LoginPage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import AuthCallback from "../pages/auth/AuthCallback.jsx";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";

// User Experience Pages (Phase 6)
import UserDashboardPage from "../pages/user/UserDashboardPage.jsx";
import SavedPropertiesPage from "../pages/user/SavedPropertiesPage.jsx";
import UserEnquiriesPage from "../pages/user/UserEnquiriesPage.jsx";

// Legacy Redirects and Compatibility
import {
  LegacySearchRedirect,
  LegacyPropertyRedirect,
  UnmigratedFeatureNotice,
} from "./legacyRedirects.jsx";
import { PATHS } from "./paths.js";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Browsing Routes */}
        <Route path={PATHS.HOME} element={<HomePage />} />
        <Route path={PATHS.SEARCH} element={<SearchPage />} />
        <Route path={PATHS.PROPERTY_DETAILS} element={<PropertyDetailsPage />} />
        <Route path={PATHS.HOTEL_ROOM} element={<PropertyDetailsPage />} />
        <Route path={PATHS.POLICIES} element={<PoliciesPage />} />

        {/* Authentication Routes */}
        <Route
          path={PATHS.LOGIN}
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={PATHS.SIGNUP}
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={PATHS.FORGOT_PASSWORD}
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route path={PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={PATHS.AUTH_CALLBACK} element={<AuthCallback />} />

        {/* Authenticated User Experience Routes (Phase 6) */}
        <Route
          path={PATHS.DASHBOARD}
          element={
            <ProtectedRoute>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.SAVED}
          element={
            <ProtectedRoute>
              <SavedPropertiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.ENQUIRIES}
          element={
            <ProtectedRoute>
              <UserEnquiriesPage />
            </ProtectedRoute>
          }
        />

        {/* Unmigrated Feature Placeholders (Scheduled for Phase 7-8) */}
        <Route
          path="/owner/dashboard"
          element={
            <UnmigratedFeatureNotice
              featureName="Owner Dashboard"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/list-property"
          element={
            <UnmigratedFeatureNotice
              featureName="Listing Hub"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/admin"
          element={
            <UnmigratedFeatureNotice
              featureName="Admin Management Console"
              phaseName="Phase 8 (Admin Experience)"
            />
          }
        />
        <Route
          path="/be-an-agent"
          element={
            <UnmigratedFeatureNotice
              featureName="Agent Application"
              phaseName="Phase 8 (Agent Operations)"
            />
          }
        />

        {/* Legacy URL Redirections & Compatibility Shims */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/search.html" element={<LegacySearchRedirect />} />
        <Route path="/property.html" element={<LegacyPropertyRedirect />} />
        <Route path="/policies.html" element={<Navigate to="/policies" replace />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
        <Route path="/reset-password.html" element={<Navigate to="/reset-password" replace />} />
        <Route path="/auth-callback.html" element={<Navigate to="/auth/callback" replace />} />
        <Route path="/user-dashboard.html" element={<Navigate to="/dashboard" replace />} />
        <Route path="/saved.html" element={<Navigate to="/saved" replace />} />
        <Route path="/enquiries.html" element={<Navigate to="/enquiries" replace />} />

        {/* Unmigrated Legacy URLs (Scheduled for Phase 7-8) */}
        <Route
          path="/owner-dashboard.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Owner Dashboard"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/list-property.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Property Listing Wizard"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/list-pg.html"
          element={
            <UnmigratedFeatureNotice
              featureName="PG Listing Form"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/list-flat.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Flat Listing Form"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/list-hotel.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Hotel Listing Form"
              phaseName="Phase 7 (Owner Experience)"
            />
          }
        />
        <Route
          path="/admin.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Admin Management Console"
              phaseName="Phase 8 (Admin Experience)"
            />
          }
        />
        <Route
          path="/be-an-agent.html"
          element={
            <UnmigratedFeatureNotice
              featureName="Agent Application"
              phaseName="Phase 8 (Agent Operations)"
            />
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;

