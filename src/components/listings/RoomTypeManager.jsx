import React from "react";

export default function RoomTypeManager({
  roomTypes = [],
  onChange,
  showNightlyRate = false,
}) {
  const handleRoomChange = (index, field, value) => {
    const updated = [...roomTypes];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleAddRoom = () => {
    const newRoom = {
      name: "",
      price_monthly: "",
      price_per_night: "",
      occupancy: 1,
      available_rooms: 1,
      total_rooms: 1,
    };
    onChange([...roomTypes, newRoom]);
  };

  const handleRemoveRoom = (indexToRemove) => {
    if (roomTypes.length <= 1) return;
    const updated = roomTypes.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="room-manager-container">
      {roomTypes.map((room, index) => (
        <div key={room.id || index} className="room-type-card">
          <div className="room-type-card-header">
            <h4>Room Option #{index + 1}</h4>
            {roomTypes.length > 1 && (
              <button
                type="button"
                className="room-type-remove-btn"
                onClick={() => handleRemoveRoom(index)}
              >
                ✕ Remove Room
              </button>
            )}
          </div>

          <div className="wizard-form-grid">
            <div className="wizard-form-group">
              <label>Room Name / Sharing Type</label>
              <input
                type="text"
                placeholder="e.g. Single Room, 2 Sharing, Deluxe"
                value={room.name || ""}
                onChange={(e) => handleRoomChange(index, "name", e.target.value)}
                required
              />
            </div>

            <div className="wizard-form-group">
              <label>Monthly Rent (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5500"
                value={room.price_monthly ?? ""}
                onChange={(e) => handleRoomChange(index, "price_monthly", e.target.value)}
                required={!showNightlyRate}
              />
            </div>

            {showNightlyRate && (
              <div className="wizard-form-group">
                <label>Nightly Rate (₹) (Optional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1200"
                  value={room.price_per_night ?? ""}
                  onChange={(e) => handleRoomChange(index, "price_per_night", e.target.value)}
                />
              </div>
            )}

            <div className="wizard-form-group">
              <label>Max People / Beds</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={room.occupancy ?? 1}
                onChange={(e) => handleRoomChange(index, "occupancy", Number(e.target.value))}
                required
              />
            </div>

            <div className="wizard-form-group">
              <label>Available Rooms Count</label>
              <input
                type="number"
                min="0"
                placeholder="1"
                value={room.available_rooms ?? 1}
                onChange={(e) => handleRoomChange(index, "available_rooms", Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="owner-action-btn view"
        style={{ padding: "10px 16px", alignSelf: "flex-start", marginTop: "8px" }}
        onClick={handleAddRoom}
      >
        + Add Another Room Option
      </button>
    </div>
  );
}
