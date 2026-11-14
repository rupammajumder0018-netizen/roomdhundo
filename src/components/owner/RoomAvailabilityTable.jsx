import React, { useState, useMemo } from "react";

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
        <strong>Manage Room Availability</strong>
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
              <th>Rent</th>
              <th>Occupancy</th>
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
                const isAvail = (Number(room.available_rooms) || 0) > 0;
                const rent = Number(room.price_monthly) || Number(room.price_per_night) || 0;
                return (
                  <tr key={room.id}>
                    <td>
                      <strong>{room.propertyName}</strong>
                    </td>
                    <td>{room.name || "Standard Room"}</td>
                    <td>{rent > 0 ? `₹${rent.toLocaleString()}` : "—"}</td>
                    <td>{room.occupancy ? `${room.occupancy} Person` : "1 Person"}</td>
                    <td>
                      <span className={`room-status-pill ${isAvail ? "available" : "occupied"}`}>
                        {isAvail ? "🟢 Available" : "🔴 Occupied"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`room-status-btn ${isAvail ? "to-occupied" : "to-available"}`}
                        onClick={() => onToggleRoom(room.id, room.buildingId, room.available_rooms)}
                      >
                        {isAvail ? "Mark Occupied" : "Mark Available"}
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
