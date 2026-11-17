import React from "react";
import { Link } from "react-router-dom";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { ROUTE_PATHS } from "../../routes/paths";

export default function ListingHubPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--rd-bg)] text-[var(--rd-text)]">
      <Header />

      <main className="flex-1">
        <div className="listing-hub-page">
          <div className="listing-hub-header">
            <h1>List Your Property</h1>
            <p>
              Choose the category that best matches your accommodation to begin your listing.
            </p>
          </div>

          <div className="listing-hub-grid">
            <Link to={ROUTE_PATHS.LIST_PG} className="listing-hub-card">
              <div className="listing-hub-icon">🛏️</div>
              <h3>PG / Hostel / Room</h3>
              <p>
                List individual rooms or sharing beds with flexible meal plans, Wi-Fi, and amenities for students and working professionals.
              </p>
            </Link>

            <Link to={ROUTE_PATHS.LIST_FLAT} className="listing-hub-card">
              <div className="listing-hub-icon">🏢</div>
              <h3>Flat / Apartment</h3>
              <p>
                List 1BHK, 2BHK, 3BHK, or studio apartments for rent or sale with detailed floor plans, carpet area, and tenant preferences.
              </p>
            </Link>

            <Link to={ROUTE_PATHS.LIST_HOTEL} className="listing-hub-card">
              <div className="listing-hub-icon">🏨</div>
              <h3>Hotel / Guest House</h3>
              <p>
                List hotel rooms with star rating, check-in/out policies, room photo galleries, and hourly or nightly booking options.
              </p>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
