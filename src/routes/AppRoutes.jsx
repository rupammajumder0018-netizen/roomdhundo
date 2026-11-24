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

// Owner & Listing Pages (Phase 7)
import OwnerDashboardPage from "../pages/owner/OwnerDashboardPage.jsx";
import ListingHubPage from "../pages/listings/ListingHubPage.jsx";
import PropertyListingFormPage from "../pages/listings/PropertyListingFormPage.jsx";
import PgListingPage from "../pages/listings/PgListingPage.jsx";
import FlatListingPage from "../pages/listings/FlatListingPage.jsx";
import HotelListingPage from "../pages/listings/HotelListingPage.jsx";

// Booking & Payment Pages (Phase 9)
import PaymentPage from "../pages/payment/PaymentPage.jsx";

// Admin & Agent Pages (Phase 8 & 9)
import AdminLayout from "../layouts/AdminLayout.jsx";
import AdminLoginPage from "../pages/admin/AdminLoginPage.jsx";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminPropertiesPage from "../pages/admin/AdminPropertiesPage.jsx";
import AdminPropertyEditPage from "../pages/admin/AdminPropertyEditPage.jsx";
import AdminHotelBookingsPage from "../pages/admin/AdminHotelBookingsPage.jsx";
import AdminUsersPage from "../pages/admin/AdminUsersPage.jsx";
import AdminAgentsPage from "../pages/admin/AdminAgentsPage.jsx";
import AdminEnquiriesPage from "../pages/admin/AdminEnquiriesPage.jsx";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage.jsx";
import AdminEconomyPage from "../pages/admin/AdminEconomyPage.jsx";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage.jsx";
import BeAnAgentPage from "../pages/agent/BeAnAgentPage.jsx";

// Legacy Redirects and Compatibility
import {
  LegacySearchRedirect,
  LegacyPropertyRedirect,
  LegacyPaymentRedirect,
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
        <Route path={PATHS.PAYMENT} element={<PaymentPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
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

        {/* Authenticated Owner & Listing Routes (Phase 7) */}
        <Route
          path={PATHS.OWNER_DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <OwnerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.LIST_PROPERTY}
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <ListingHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list-property/create"
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <PropertyListingFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list-property/event"
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <PropertyListingFormPage defaultCategory="event_spaces" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list-property/commercial"
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <PropertyListingFormPage defaultCategory="commercial" />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.LIST_PG}
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <PgListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.LIST_FLAT}
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <FlatListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={PATHS.LIST_HOTEL}
          element={
            <ProtectedRoute allowedRoles={["owner", "admin", "agent"]}>
              <HotelListingPage />
            </ProtectedRoute>
          }
        />

        {/* Agent Application Page (Phase 8) */}
        <Route path={PATHS.BE_AN_AGENT} element={<BeAnAgentPage />} />

        {/* Dedicated Admin Login Route */}
        <Route
          path={PATHS.ADMIN_LOGIN}
          element={
            <PublicOnlyRoute defaultRedirect={PATHS.ADMIN}>
              <AdminLoginPage />
            </PublicOnlyRoute>
          }
        />

        {/* Authenticated Admin Management Console (Phase 8) */}
        <Route
          path={PATHS.ADMIN}
          element={
            <ProtectedRoute allowedRoles={["admin"]} redirectTo={PATHS.ADMIN_LOGIN}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="properties/new" element={<AdminPropertyEditPage />} />
          <Route path="properties/:propertyId/edit" element={<AdminPropertyEditPage />} />
          <Route path="hotel-bookings" element={<AdminHotelBookingsPage />} />
          <Route path="profiles" element={<AdminUsersPage />} />
          <Route path="agents" element={<AdminAgentsPage />} />
          <Route path="enquiries" element={<AdminEnquiriesPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="economy" element={<AdminEconomyPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Legacy URL Redirections & Compatibility Shims */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/search.html" element={<LegacySearchRedirect />} />
        <Route path="/property.html" element={<LegacyPropertyRedirect />} />
        <Route path="/payment.html" element={<LegacyPaymentRedirect />} />
        <Route path="/policies.html" element={<Navigate to="/policies" replace />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
        <Route path="/reset-password.html" element={<Navigate to="/reset-password" replace />} />
        <Route path="/auth-callback.html" element={<Navigate to="/auth/callback" replace />} />
        <Route path="/user-dashboard.html" element={<Navigate to="/dashboard" replace />} />
        <Route path="/saved.html" element={<Navigate to="/saved" replace />} />
        <Route path="/enquiries.html" element={<Navigate to="/enquiries" replace />} />
        <Route path="/owner-dashboard.html" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/list-property.html" element={<Navigate to="/list-property" replace />} />
        <Route path="/list-pg.html" element={<Navigate to="/list-property/pg" replace />} />
        <Route path="/list-flat.html" element={<Navigate to="/list-property/flat" replace />} />
        <Route path="/list-hotel.html" element={<Navigate to="/list-property/hotel" replace />} />

        {/* Legacy Admin & Agent URLs */}
        <Route path="/admin.html" element={<Navigate to={PATHS.ADMIN} replace />} />
        <Route path="/be-an-agent.html" element={<Navigate to={PATHS.BE_AN_AGENT} replace />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;

