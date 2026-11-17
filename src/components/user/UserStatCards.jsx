import React from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../../routes/paths.js";

/**
 * Top statistics cards for User Dashboard:
 * - Saved Properties count (navigates to /saved)
 * - My Enquiries count (navigates to /enquiries)
 * - Account Type badge
 *
 * @param {Object} props
 * @param {number} props.savedCount
 * @param {number} props.enquiryCount
 * @param {string} props.roleLabel
 * @param {boolean} [props.isLoading=false]
 */
export function UserStatCards({
  savedCount = 0,
  enquiryCount = 0,
  roleLabel = "Renter",
  isLoading = false,
}) {
  return (
    <div className="renter-dashboard-cards">
      {/* SAVED PROPERTIES */}
      <Link
        to={PATHS.SAVED}
        className="renter-stat-card stat-card-button"
        id="dashboardSavedStatBtn"
        aria-label={`Saved properties: ${savedCount}`}
      >
        <div className="stat-icon" aria-hidden="true">
          ❤️
        </div>
        <div>
          <span>Saved Properties</span>
          <strong id="savedPropertyCount">
            {isLoading ? "..." : savedCount}
          </strong>
        </div>
      </Link>

      {/* MY ENQUIRIES */}
      <Link
        to={PATHS.ENQUIRIES}
        className="renter-stat-card stat-card-button"
        id="dashboardEnquiriesStatBtn"
        aria-label={`My enquiries: ${enquiryCount}`}
      >
        <div className="stat-icon" aria-hidden="true">
          📩
        </div>
        <div>
          <span>My Enquiries</span>
          <strong id="enquiryCount">
            {isLoading ? "..." : enquiryCount}
          </strong>
        </div>
      </Link>

      {/* ACCOUNT TYPE */}
      <div className="renter-stat-card">
        <div className="stat-icon" aria-hidden="true">
          👤
        </div>
        <div>
          <span>Account Type</span>
          <strong id="dashboardAccountType">{roleLabel}</strong>
        </div>
      </div>
    </div>
  );
}

export default UserStatCards;
