import React from "react";
import { Building2, BedDouble, CheckCircle2, DoorClosed, ArrowUpRight } from "lucide-react";

export default function OwnerStatCards({
  totalProperties = 0,
  totalRooms = 0,
  availableRooms = 0,
  occupiedRooms = 0,
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="owner-stats-grid" role="region" aria-label="Owner statistics">
      <div
        className="owner-stat-card owner-stat-card-clickable"
        onClick={() => scrollTo("properties")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") scrollTo("properties");
        }}
        title="View My Properties"
      >
        <div className="owner-stat-top">
          <div className="owner-stat-icon props">
            <Building2 size={22} strokeWidth={2.2} />
          </div>
          <ArrowUpRight size={16} className="stat-card-arrow" />
        </div>
        <div className="owner-stat-info">
          <span>Total Properties</span>
          <h3>{totalProperties}</h3>
        </div>
      </div>

      <div
        className="owner-stat-card owner-stat-card-clickable"
        onClick={() => scrollTo("rooms")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") scrollTo("rooms");
        }}
        title="View Room Availability"
      >
        <div className="owner-stat-top">
          <div className="owner-stat-icon rooms">
            <BedDouble size={22} strokeWidth={2.2} />
          </div>
          <ArrowUpRight size={16} className="stat-card-arrow" />
        </div>
        <div className="owner-stat-info">
          <span>Total Rooms</span>
          <h3>{totalRooms}</h3>
        </div>
      </div>

      <div
        className="owner-stat-card owner-stat-card-clickable"
        onClick={() => scrollTo("rooms")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") scrollTo("rooms");
        }}
        title="View Available Rooms"
      >
        <div className="owner-stat-top">
          <div className="owner-stat-icon available">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <ArrowUpRight size={16} className="stat-card-arrow" />
        </div>
        <div className="owner-stat-info">
          <span>Available Rooms</span>
          <h3>{availableRooms}</h3>
        </div>
      </div>

      <div
        className="owner-stat-card owner-stat-card-clickable"
        onClick={() => scrollTo("rooms")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") scrollTo("rooms");
        }}
        title="View Occupied Rooms"
      >
        <div className="owner-stat-top">
          <div className="owner-stat-icon occupied">
            <DoorClosed size={22} strokeWidth={2.2} />
          </div>
          <ArrowUpRight size={16} className="stat-card-arrow" />
        </div>
        <div className="owner-stat-info">
          <span>Occupied Rooms</span>
          <h3>{occupiedRooms}</h3>
        </div>
      </div>
    </div>
  );
}
