import React from "react";

export default function OwnerStatCards({
  totalProperties = 0,
  totalRooms = 0,
  availableRooms = 0,
  occupiedRooms = 0,
}) {
  return (
    <div className="owner-stats-grid">
      <div className="owner-stat-card">
        <div className="owner-stat-icon props">🏢</div>
        <div className="owner-stat-info">
          <span>Total Properties</span>
          <h3>{totalProperties}</h3>
        </div>
      </div>

      <div className="owner-stat-card">
        <div className="owner-stat-icon rooms">🚪</div>
        <div className="owner-stat-info">
          <span>Total Rooms</span>
          <h3>{totalRooms}</h3>
        </div>
      </div>

      <div className="owner-stat-card">
        <div className="owner-stat-icon available">🟢</div>
        <div className="owner-stat-info">
          <span>Available Rooms</span>
          <h3>{availableRooms}</h3>
        </div>
      </div>

      <div className="owner-stat-card">
        <div className="owner-stat-icon occupied">🔴</div>
        <div className="owner-stat-info">
          <span>Occupied Rooms</span>
          <h3>{occupiedRooms}</h3>
        </div>
      </div>
    </div>
  );
}
