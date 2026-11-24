import React, { useState } from "react";
import {
  Store,
  Building2,
  Briefcase,
  Maximize2,
  Layers,
  DoorOpen,
  Zap,
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Utensils,
  Warehouse,
  FileText,
  BadgePercent,
  Calendar,
  Check,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

export function CommercialPropertyRental({ building, onEnquireUnit }) {
  if (!building) return null;

  const meta = building.category_details || building.hotel_meta || {};
  const subcategories = Array.isArray(building.subcategories) ? building.subcategories : [];
  const primarySub = subcategories.find((s) => s !== "All") || building.primaryType || "Commercial Space";
  const units = Array.isArray(building.room_types) ? building.room_types : [];

  const [selectedUnit, setSelectedUnit] = useState(null);

  // Suitable business types
  const suitableBusinesses = Array.isArray(meta.suitableBusinesses)
    ? meta.suitableBusinesses
    : typeof meta.suitableBusinesses === "string"
    ? meta.suitableBusinesses.split(",").map((s) => s.trim())
    : [
        "Retail Shop / Store",
        "Office Space / IT",
        "Showroom",
        "Clinic / Diagnostic",
        "Bank / ATM",
      ];

  return (
    <div className="commercial-property-rental" id="commercialRentalSection">
      {/* 1. Header Overview & Primary Subcategory */}
      <section className="property-section commercial-overview-card">
        <div className="commercial-header-row">
          <div>
            <div className="commercial-subcat-badge">
              <Store size={14} />
              <span>{primarySub}</span>
            </div>
            <h2 style={{ marginTop: "10px", marginBottom: "6px" }}>Commercial Property Overview</h2>
            <p style={{ color: "var(--rd-muted, #3a6f86)", fontSize: "14px", margin: 0 }}>
              Tailored commercial rental space suitable for enterprise, retail, or local business operations.
            </p>
          </div>

          {meta.totalArea && (
            <div className="commercial-area-stat">
              <span className="area-stat-val">{Number(meta.totalArea).toLocaleString("en-IN")}</span>
              <span className="area-stat-unit">sq. ft. Total</span>
            </div>
          )}
        </div>

        {/* 2. Commercial Specifications Grid */}
        <div className="commercial-specs-grid" style={{ marginTop: "20px" }}>
          <div className="commercial-spec-item">
            <span className="spec-label">Total Super Area</span>
            <strong className="spec-val">
              {meta.totalArea ? `${meta.totalArea} sq. ft.` : "—"}
            </strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Carpet Area</span>
            <strong className="spec-val">
              {meta.carpetArea ? `${meta.carpetArea} sq. ft.` : meta.totalArea ? `${Math.round(Number(meta.totalArea) * 0.8)} sq. ft.` : "—"}
            </strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Floor Located</span>
            <strong className="spec-val">{meta.floorNumber || "Ground Floor"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Total Floors</span>
            <strong className="spec-val">{meta.totalFloors ? `${meta.totalFloors} Floors` : "—"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Furnishing Status</span>
            <strong className="spec-val">{meta.furnishingStatus || building.furnishing || "Unfurnished"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Washrooms</span>
            <strong className="spec-val">
              {meta.washrooms ? `${meta.washrooms} (${meta.washroomType || "Private"})` : "Available"}
            </strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Power Backup</span>
            <strong className="spec-val">{meta.powerBackup || "Full Power Backup"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Road Access</span>
            <strong className="spec-val">{meta.roadAccess || "Main Road Facing"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Parking Facilities</span>
            <strong className="spec-val">{meta.parking || "Parking Available"}</strong>
          </div>

          <div className="commercial-spec-item">
            <span className="spec-label">Lift / Elevator</span>
            <strong className="spec-val">{meta.lift || "Available"}</strong>
          </div>
        </div>
      </section>

      {/* 3. Subcategory-Specific Highlights */}
      {(primarySub.includes("Shop") ||
        primarySub.includes("Showroom") ||
        primarySub.includes("Office") ||
        primarySub.includes("Coworking") ||
        primarySub.includes("Warehouse") ||
        primarySub.includes("Godown") ||
        primarySub.includes("Restaurant") ||
        primarySub.includes("Industrial") ||
        primarySub.includes("Building")) && (
        <section className="property-section">
          <h2>Property Highlights & Capabilities</h2>
          <div className="commercial-highlights-grid">
            {/* Retail & Showroom highlights */}
            {(primarySub.includes("Shop") || primarySub.includes("Showroom")) && (
              <>
                <div className="commercial-highlight-box">
                  <Maximize2 size={18} className="highlight-icon" />
                  <div>
                    <h4>Frontage & Visibility</h4>
                    <p>{meta.shopFrontage || meta.frontage ? `${meta.shopFrontage || meta.frontage} ft. wide frontage` : "High-footfall main street display"}</p>
                  </div>
                </div>
                <div className="commercial-highlight-box">
                  <DoorOpen size={18} className="highlight-icon" />
                  <div>
                    <h4>Entrance & Shutter</h4>
                    <p>{meta.shutterType || "Heavy-duty rolling shutter with security lock"}</p>
                  </div>
                </div>
              </>
            )}

            {/* Office & Coworking highlights */}
            {(primarySub.includes("Office") || primarySub.includes("Coworking")) && (
              <>
                <div className="commercial-highlight-box">
                  <Briefcase size={18} className="highlight-icon" />
                  <div>
                    <h4>Workspaces & Cabins</h4>
                    <p>
                      {meta.cabinsCount ? `${meta.cabinsCount} Executive Cabins · ` : ""}
                      {meta.workstationsCount || meta.desksCount ? `${meta.workstationsCount || meta.desksCount} Workstations` : "Plug & Play layout"}
                    </p>
                  </div>
                </div>
                <div className="commercial-highlight-box">
                  <Layers size={18} className="highlight-icon" />
                  <div>
                    <h4>Conference & Reception</h4>
                    <p>Meeting room with reception lounge and visitor waiting area</p>
                  </div>
                </div>
              </>
            )}

            {/* Warehouse & Godown highlights */}
            {(primarySub.includes("Warehouse") || primarySub.includes("Godown")) && (
              <>
                <div className="commercial-highlight-box">
                  <Truck size={18} className="highlight-icon" />
                  <div>
                    <h4>Loading & Truck Access</h4>
                    <p>{meta.loadingDock || "Heavy trailer and 40ft container loading dock"}</p>
                  </div>
                </div>
                <div className="commercial-highlight-box">
                  <Warehouse size={18} className="highlight-icon" />
                  <div>
                    <h4>Ceiling Height & Floor Capacity</h4>
                    <p>{meta.ceilingHeight ? `${meta.ceilingHeight} ceiling height` : "18+ ft ceiling"} with heavy-duty industrial flooring</p>
                  </div>
                </div>
              </>
            )}

            {/* Restaurant Space highlights */}
            {primarySub.includes("Restaurant") && (
              <>
                <div className="commercial-highlight-box">
                  <Utensils size={18} className="highlight-icon" />
                  <div>
                    <h4>Kitchen & Exhaust</h4>
                    <p>{meta.exhaustVentilation || "Commercial chimney ducting and dedicated food prep area"}</p>
                  </div>
                </div>
                <div className="commercial-highlight-box">
                  <ShieldCheck size={18} className="highlight-icon" />
                  <div>
                    <h4>Dining & Gas Permits</h4>
                    <p>{meta.gasPipelinePermit || "Commercial LPG/PNG approved with indoor dining"}</p>
                  </div>
                </div>
              </>
            )}

            {/* Industrial Space highlights */}
            {primarySub.includes("Industrial") && (
              <>
                <div className="commercial-highlight-box">
                  <Zap size={18} className="highlight-icon" />
                  <div>
                    <h4>High-Tension Power</h4>
                    <p>{meta.transformerCapacity || "Heavy 3-phase industrial power connection"}</p>
                  </div>
                </div>
                <div className="commercial-highlight-box">
                  <Building2 size={18} className="highlight-icon" />
                  <div>
                    <h4>Industrial Zoning</h4>
                    <p>{meta.industrialZone || "Approved for light manufacturing and fabrication"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* 4. Business Usage & Permitted Activities */}
      <section className="property-section">
        <h2>Suitable Businesses & Permissions</h2>
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--rd-muted, #3a6f86)", textTransform: "uppercase", marginBottom: "8px" }}>
            Recommended Business Types
          </p>
          <div className="suitable-businesses-chips">
            {suitableBusinesses.map((biz, idx) => (
              <span key={idx} className="biz-chip">
                <Check size={12} className="biz-chip-check" />
                <span>{biz}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="commercial-permissions-grid">
          <div className="permission-item">
            <span className="permission-label">Permitted Commercial Activities</span>
            <span className="permission-val">{meta.permittedActivities || "All Standard Commercial Activities"}</span>
          </div>
          <div className="permission-item">
            <span className="permission-label">Signage & Branding</span>
            <span className="permission-val">{meta.signboardPermission || "Allowed on Facade"}</span>
          </div>
          <div className="permission-item">
            <span className="permission-label">Operating Hours</span>
            <span className="permission-val">{meta.operatingHours || "24x7 Access Permitted"}</span>
          </div>
          {meta.usageRestrictions && (
            <div className="permission-item">
              <span className="permission-label">Usage Restrictions</span>
              <span className="permission-val">{meta.usageRestrictions}</span>
            </div>
          )}
        </div>
      </section>

      {/* 5. Commercial Rental Pricing & Lease Terms */}
      <section className="property-section">
        <h2>Commercial Rental Terms & Pricing</h2>
        <div className="commercial-terms-grid">
          <div className="term-card">
            <span className="term-label">Monthly Rent</span>
            <strong className="term-val text-accent">
              ₹{Number(building.minPrice || meta.monthlyRent || 0).toLocaleString("en-IN")}
              <span className="term-sub"> / month</span>
            </strong>
          </div>

          <div className="term-card">
            <span className="term-label">Security Deposit</span>
            <strong className="term-val">
              {meta.securityDeposit ? `₹${Number(meta.securityDeposit).toLocaleString("en-IN")}` : "3 Months Rent Equivalent"}
            </strong>
          </div>

          <div className="term-card">
            <span className="term-label">Maintenance Charges</span>
            <strong className="term-val">
              {meta.maintenanceCharges ? `₹${Number(meta.maintenanceCharges).toLocaleString("en-IN")}` : "Included in Rent"}
              {meta.maintenanceCharges ? <span className="term-sub"> ({meta.maintenanceFrequency || "Monthly"})</span> : ""}
            </strong>
          </div>

          <div className="term-card">
            <span className="term-label">Minimum Lock-in Period</span>
            <strong className="term-val">{meta.minRentalPeriod || "11 Months"}</strong>
          </div>

          <div className="term-card">
            <span className="term-label">Preferred Lease Duration</span>
            <strong className="term-val">{meta.preferredLease || "3 to 5 Years"}</strong>
          </div>

          <div className="term-card">
            <span className="term-label">Electricity & Water</span>
            <strong className="term-val">
              {meta.electricityCharges || "As per Commercial Meter"}
            </strong>
          </div>
        </div>
      </section>

      {/* 6. Rentable Units & Spaces (Unit-Level Availability Management) */}
      {units.length > 0 && (
        <section className="property-section" id="commercialUnitsSection">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ margin: 0 }}>Available Commercial Units & Spaces</h2>
              <p style={{ color: "var(--rd-muted, #3a6f86)", fontSize: "14px", margin: "4px 0 0 0" }}>
                {units.length} separately rentable unit{units.length > 1 ? "s" : ""} in this commercial property.
              </p>
            </div>
          </div>

          <div className="commercial-units-list">
            {units.map((unit, uIdx) => {
              const uDetails = unit.room_details || {};
              const availCount = Number(unit.available_rooms != null ? unit.available_rooms : unit.available_beds || 1);
              const isOccupied = availCount <= 0 || String(unit.availability).toLowerCase() === "occupied" || String(unit.availability).toLowerCase() === "rented";
              const unitTitle = uDetails.room_name || unit.room_type || `Unit #${uIdx + 1}`;
              const unitSize = unit.room_size || uDetails.room_size || (meta.totalArea ? `${meta.totalArea} sq.ft` : null);
              const unitRent = Number(unit.price_value || unit.monthly_rent || building.minPrice || 0);

              return (
                <div
                  key={unit.id || uIdx}
                  className={`commercial-unit-card ${isOccupied ? "unit-rented" : "unit-available"} ${selectedUnit === unit.id ? "unit-selected" : ""}`}
                >
                  <div className="unit-left-info">
                    <div className="unit-title-row">
                      <strong className="unit-title">{unitTitle}</strong>
                      <span className={`unit-status-pill ${isOccupied ? "status-rented" : "status-avail"}`}>
                        {isOccupied ? "Rented / Unavailable" : "Available for Rent"}
                      </span>
                    </div>

                    <div className="unit-specs-chips">
                      {unitSize && (
                        <span className="unit-chip">
                          <Maximize2 size={12} />
                          <span>{unitSize}</span>
                        </span>
                      )}
                      {unit.attached_bath && (
                        <span className="unit-chip">
                          <DoorOpen size={12} />
                          <span>Private Washroom</span>
                        </span>
                      )}
                      {unit.ac_available && (
                        <span className="unit-chip">
                          <span>❄️ Air Conditioned</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="unit-right-actions">
                    <div className="unit-price-box">
                      <strong className="unit-price">₹{unitRent.toLocaleString("en-IN")}</strong>
                      <span className="unit-price-sub">/ month</span>
                    </div>

                    <button
                      type="button"
                      disabled={isOccupied}
                      className="commercial-enquire-btn"
                      onClick={() => {
                        setSelectedUnit(unit.id);
                        if (onEnquireUnit) {
                          onEnquireUnit(unit);
                        }
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>{isOccupied ? "Occupied" : "Enquire for Lease"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default CommercialPropertyRental;
