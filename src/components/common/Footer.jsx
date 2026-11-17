import React from "react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">© 2026 Pg Dhundo</p>
        <p className="site-footer-fee">
          One-time service fee: Pg Dhundo charges 10% of the total rent on PG and flat
          bookings only, paid once when you confirm a stay through us. Hotels are not
          included. This is not a monthly or repeating charge.
        </p>
        <div className="site-footer-social">
          <h2 className="site-footer-social-title">Connect with us</h2>
          <a
            className="site-footer-instagram"
            href="https://www.instagram.com/room_dhundo?xtok=aTZndTdlMzRoNGw3"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pg Dhundo on Instagram"
            title="Instagram"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2zm4.35-3.45a.95.95 0 1 1-.95.95.95.95 0 0 1 .95-.95z"
              />
            </svg>
          </a>
        </div>
        <nav className="site-footer-links" aria-label="Footer Policies">
          <Link to="/policies">Policies</Link>
          <Link to="/policies#payment">10% payment</Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;

