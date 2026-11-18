import React from "react";

export const PG_SHARING_OPTIONS = [
  { people: 1, label: "Single", hint: "1 person in the room" },
  { people: 2, label: "Double", hint: "2 sharing" },
  { people: 3, label: "Triple", hint: "3 sharing" },
  { people: 4, label: "Four", hint: "4 sharing" },
];

function emptyShares() {
  return {
    1: { enabled: false, rent: "" },
    2: { enabled: false, rent: "" },
    3: { enabled: false, rent: "" },
    4: { enabled: false, rent: "" },
  };
}

export function emptyPgRoom() {
  return {
    id: null,
    name: "",
    roomCount: 1,
    shares: emptyShares(),
  };
}

function inferPeople(room) {
  const people = Number(room?.room_people);
  if (Number.isFinite(people) && people >= 1) return Math.min(4, people);
  const text = String(room?.room_type || room?.name || "").toLowerCase();
  if (/\b(4|four)\b/.test(text)) return 4;
  if (/\b(3|triple)\b/.test(text)) return 3;
  if (/\b(2|double)\b/.test(text)) return 2;
  return 1;
}

function isSharingOnlyLabel(value) {
  const text = String(value || "").trim();
  if (!text) return true;
  return /^(single|\d+\s*sharing|double sharing|triple sharing|4\+\s*sharing)(\s*\/\s*(single|\d+\s*sharing|double sharing|triple sharing|4\+\s*sharing))*$/i.test(
    text
  );
}

export function dbRoomsToPgForm(roomTypes) {
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) return [emptyPgRoom()];

  return roomTypes.map((room) => {
    const details = room.room_details && typeof room.room_details === "object" ? room.room_details : {};
    const saved = Array.isArray(details.occupancy_options) ? details.occupancy_options : [];
    const shares = emptyShares();

    if (saved.length > 0) {
      saved.forEach((option) => {
        const people = Math.min(4, Math.max(1, Number(option.people) || 1));
        shares[people] = {
          enabled: true,
          rent: option.rent ?? "",
        };
      });
    } else {
      const people = inferPeople(room);
      const rent = room.price_value ?? room.room_rent ?? room.price_monthly ?? "";
      shares[people] = { enabled: true, rent };
    }

    const storedName = String(details.room_name || "").trim();
    const fallbackName = isSharingOnlyLabel(room.room_type) ? "" : String(room.room_type || "").trim();

    return {
      id: room.id || null,
      name: storedName || fallbackName,
      roomCount: Number(room.total_rooms || room.available_rooms || 1) || 1,
      shares,
    };
  });
}

function selectedShares(room) {
  return PG_SHARING_OPTIONS.filter((option) => room.shares?.[option.people]?.enabled).map((option) => ({
    people: option.people,
    label: option.people === 1 ? "Single" : `${option.people} Sharing`,
    rent: room.shares[option.people].rent,
  }));
}

export function validatePgRooms(rooms) {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return "Add at least one room.";
  }

  for (let index = 0; index < rooms.length; index += 1) {
    const room = rooms[index];
    const label = room.name?.trim() || `Room ${index + 1}`;
    const count = Number(room.roomCount);
    if (!Number.isFinite(count) || count < 1) {
      return `Enter how many rooms you have for ${label}.`;
    }

    const shares = selectedShares(room);
    if (shares.length === 0) {
      return `Select at least one sharing type for ${label}. The same room can be single, double, triple, or four sharing.`;
    }

    for (const share of shares) {
      const rent = Number(share.rent);
      if (!Number.isFinite(rent) || rent <= 0) {
        return `Enter the monthly rent for ${share.label.toLowerCase()} on ${label}.`;
      }
    }
  }

  return "";
}

export function pgRoomsToPayload(rooms) {
  return rooms.map((room) => {
    const shares = selectedShares(room).map((share) => ({
      people: share.people,
      rent: Number(share.rent),
      label: share.label,
    }));
    const rents = shares.map((share) => share.rent);
    const summary = shares.map((share) => share.label).join(" / ");
    const name = room.name?.trim();
    const count = Math.max(1, Number(room.roomCount) || 1);

    return {
      ...(room.id ? { id: room.id } : {}),
      room_type: name ? `${name} (${summary})` : summary,
      rent: Math.min(...rents),
      people: Math.max(...shares.map((share) => share.people)),
      available: count,
      totalRooms: count,
      details: {
        room_name: name || "",
        occupancy_options: shares.map(({ people, rent }) => ({ people, rent })),
      },
    };
  });
}

export default function PgRoomOptions({ rooms = [], onChange }) {
  const updateRoom = (index, patch) => {
    const next = rooms.map((room, roomIndex) => (roomIndex === index ? { ...room, ...patch } : room));
    onChange(next);
  };

  const updateShare = (index, people, patch) => {
    const room = rooms[index];
    updateRoom(index, {
      shares: {
        ...room.shares,
        [people]: { ...room.shares[people], ...patch },
      },
    });
  };

  const addRoom = () => onChange([...rooms, emptyPgRoom()]);

  const removeRoom = (index) => {
    if (rooms.length <= 1) return;
    onChange(rooms.filter((_, roomIndex) => roomIndex !== index));
  };

  return (
    <div className="room-manager-container">
      <p className="pg-room-note">
        Count the physical rooms you have. One room can be rented as single, double, triple, or four sharing.
        Tick every sharing type you offer for that room and set a rent for each.
      </p>

      {rooms.map((room, index) => (
        <div key={room.id || index} className="room-type-card">
          <div className="room-type-card-header">
            <h4>{room.name?.trim() || `Room ${index + 1}`}</h4>
            {rooms.length > 1 && (
              <button type="button" className="room-type-remove-btn" onClick={() => removeRoom(index)}>
                ✕ Remove Room
              </button>
            )}
          </div>

          <div className="wizard-form-grid">
            <div className="wizard-form-group">
              <label htmlFor={`pg-room-name-${index}`}>Room name (optional)</label>
              <input
                id={`pg-room-name-${index}`}
                type="text"
                placeholder="e.g. Ground floor AC room"
                value={room.name || ""}
                onChange={(event) => updateRoom(index, { name: event.target.value })}
              />
            </div>

            <div className="wizard-form-group">
              <label htmlFor={`pg-room-count-${index}`}>Number of rooms</label>
              <input
                id={`pg-room-count-${index}`}
                type="number"
                min="1"
                value={room.roomCount ?? 1}
                onChange={(event) => updateRoom(index, { roomCount: event.target.value })}
              />
              <small>How many identical rooms you have. Sharing options below apply to each of them.</small>
            </div>
          </div>

          <div className="pg-share-grid">
            {PG_SHARING_OPTIONS.map((option) => {
              const share = room.shares?.[option.people] || { enabled: false, rent: "" };
              return (
                <div
                  key={option.people}
                  className={`pg-share-card ${share.enabled ? "is-on" : ""}`}
                >
                  <button
                    type="button"
                    className="pg-share-toggle"
                    aria-pressed={share.enabled}
                    onClick={() => updateShare(index, option.people, { enabled: !share.enabled })}
                  >
                    <span className="pg-share-check" aria-hidden="true">
                      {share.enabled ? "✓" : ""}
                    </span>
                    <span>
                      <span className="pg-share-title">{option.label}</span>
                      <span className="pg-share-hint">{option.hint}</span>
                    </span>
                  </button>

                  {share.enabled && (
                    <label className="pg-share-rent">
                      Monthly rent (₹)
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 5500"
                        value={share.rent ?? ""}
                        onChange={(event) =>
                          updateShare(index, option.people, { rent: event.target.value })
                        }
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button type="button" className="owner-action-btn view pg-add-room-btn" onClick={addRoom}>
        + Add another room
      </button>
    </div>
  );
}
