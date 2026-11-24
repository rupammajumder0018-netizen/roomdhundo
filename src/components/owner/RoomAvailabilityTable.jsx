import React, { useState, useMemo } from "react";
import {
  occupancyOptionsFromRoom,
  roomBedCapacity,
  roomAvailableBeds,
  roomOccupiedBeds,
} from "../../services/properties/index.js";

function formatMoney(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export default function RoomAvailabilityTable({
  properties = [],
  onToggleRoom,
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  // Flatten all rooms with property info
  const allRooms = useMemo(() => {
    const list = [];
    properties.forEach((prop) => {
      if (Array.isArray(prop.room_types)) {
        prop.room_types.forEach((room) => {
          list.push({
            ...room,
            propertyName: prop.name,
            propertyCategory: prop.category,
            buildingId: prop.id,
          });
        });
      }
    });
    return list;
  }, [properties]);

  const filteredRooms = useMemo(() => {
    if (selectedPropertyId === "all") return allRooms;
    return allRooms.filter((r) => r.buildingId === selectedPropertyId);
  }, [allRooms, selectedPropertyId]);

  return (
    <div className="room-table-container">
      <div className="room-table-filter-bar">
        <strong>Manage Room & Bed Availability</strong>
        <select
          className="room-table-filter-select"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
        >
          <option value="all">All Properties ({allRooms.length} rooms)</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="room-avail-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Room Type</th>
              <th>Beds & Capacity</th>
              <th>Occupancy Pricing</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--rd-muted, #3a6f86)" }}>
                  No rooms found for this selection.
                </td>
              </tr>
            ) : (
              filteredRooms.map((room) => {
                const availBeds = roomAvailableBeds(room);
                const capBeds = roomBedCapacity(room);
                const occBeds = roomOccupiedBeds(room);
                const isAvail = availBeds > 0;
                const options = occupancyOptionsFromRoom(room);
                const roomName = room.room_details?.room_name || room.room_type || room.name || "Room";

                return (
                  <tr key={room.id}>
                    <td>
                      <strong>{room.propertyName}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--rd-text, #22577a)" }}>{roomName}</div>
                      {room.room_details?.sharing_type && (
                        <small style={{ color: "var(--rd-muted, #3a6f86)" }}>{room.room_details.sharing_type}</small>
                      )}
                    </td>
                    <td>
                      <div>
                        <strong>{availBeds} of {capBeds} Available</strong>
                      </div>
                      <small style={{ color: occBeds > 0 ? "#dc2626" : "var(--rd-muted, #3a6f86)" }}>
                        {occBeds} bed{occBeds === 1 ? "" : "s"} occupied
                      </small>
                    </td>
                    <td>
                      {options.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "12px" }}>
                          {options.map((opt) => (
                            <span key={opt.people}>
                              <strong>{opt.label}:</strong> {formatMoney(opt.rent)}/{opt.pricingType === "room" ? "room" : "person"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>{formatMoney(room.price_value || room.room_rent || room.daily_price || 0)}</span>
                      )}
                    </td>
                    <td>
                      <span className={`room-status-pill ${isAvail ? "available" : "occupied"}`}>
                        {isAvail ? `🟢 Available (${availBeds} beds)` : "🔴 Full (0 beds)"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`room-status-btn ${isAvail ? "to-occupied" : "to-available"}`}
                        onClick={() => onToggleRoom(room.id, room.buildingId, room.available_rooms)}
                      >
                        {isAvail ? "Mark Full" : "Mark Available"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
