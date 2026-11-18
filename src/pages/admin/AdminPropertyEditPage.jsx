import React, { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import ImageUploader from "../../components/listings/ImageUploader.jsx";
import PgRoomOptions, {
  dbRoomsToPgForm,
  emptyPgRoom,
  pgRoomsToPayload,
  validatePgRooms,
} from "../../components/listings/PgRoomOptions.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { PATHS } from "../../routes/paths.js";
import { fetchAdminProperty, saveAdminProperty } from "../../services/admin/adminService.js";

const PROPERTY_TYPES = ["PG", "Room", "Flat", "Hotel", "Mess", "Guest House"];

function usesSharingRooms(type) {
  const value = String(type || "").toLowerCase();
  return value === "pg" || value === "room" || value === "mess";
}

function rulesToText(rules) {
  if (Array.isArray(rules)) return rules.filter(Boolean).join("\n");
  if (typeof rules === "string") return rules;
  return "";
}

function textToRules(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function emptyGenericRoom() {
  return {
    id: null,
    room_type: "",
    price_value: "",
    daily_price: "",
    room_people: 1,
    available_rooms: 1,
    room_details: {},
  };
}

function toGenericRooms(roomTypes) {
  if (!Array.isArray(roomTypes) || roomTypes.length === 0) return [emptyGenericRoom()];
  return roomTypes.map((room) => ({
    id: room.id || null,
    room_type: room.room_type || "",
    price_value: room.price_value ?? room.room_rent ?? "",
    daily_price: room.daily_price ?? "",
    room_people: room.room_people || room.max_guests || 1,
    available_rooms: room.available_rooms ?? room.total_rooms ?? 1,
    room_details: room.room_details && typeof room.room_details === "object" ? room.room_details : {},
    hourly_price: room.hourly_price ?? null,
    weekend_price: room.weekend_price ?? null,
    extra_person_charge: room.extra_person_charge ?? null,
    room_size: room.room_size ?? null,
    adults: room.adults ?? null,
    children: room.children ?? null,
    availability: room.availability || null,
    images: room.images || null,
  }));
}

function sharingPayloadToGeneric(rooms) {
  return pgRoomsToPayload(rooms).map((room) => ({
    id: room.id || null,
    room_type: room.room_type,
    price_value: room.rent,
    daily_price: "",
    room_people: room.people,
    available_rooms: room.available,
    room_details: room.details || {},
  }));
}

export default function AdminPropertyEditPage() {
  const { propertyId } = useParams();
  const { user } = useAuth();
  const { onToggleMobileMenu } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [missing, setMissing] = useState(false);
  const errorRef = useRef(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("PG");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [facilityInput, setFacilityInput] = useState("");
  const [images, setImages] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerAltPhone, setOwnerAltPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [pgRooms, setPgRooms] = useState([emptyPgRoom()]);
  const [genericRooms, setGenericRooms] = useState([emptyGenericRoom()]);

  const applyProperty = (data) => {
    const nextType = data.type || "PG";
    setName(data.name || "");
    setType(nextType);
    setLocation(data.location || "");
    setDescription(data.description || "");
    setRules(rulesToText(data.rules));
    setFacilities(Array.isArray(data.facilities) ? data.facilities.filter(Boolean) : []);
    setImages(Array.isArray(data.images) ? data.images : []);
    setOwnerName(data.owner_name || "");
    setOwnerPhone(data.owner_phone || "");
    setOwnerAltPhone(data.owner_alt_phone || "");
    setOwnerEmail(data.owner_email || "");
    setLatitude(data.latitude != null ? String(data.latitude) : "");
    setLongitude(data.longitude != null ? String(data.longitude) : "");

    if (usesSharingRooms(nextType)) {
      setPgRooms(dbRoomsToPgForm(data.room_types));
    } else {
      setGenericRooms(toGenericRooms(data.room_types));
    }
  };

  useEffect(() => {
    let active = true;

    async function loadProperty() {
      setLoading(true);
      setFormError("");
      setSavedMessage("");
      const { data, error } = await fetchAdminProperty(propertyId);
      if (!active) return;

      if (error || !data) {
        setMissing(true);
        setFormError(error?.message || "This property could not be loaded.");
        setLoading(false);
        return;
      }

      applyProperty(data);
      setLoading(false);
    }

    loadProperty();
    return () => {
      active = false;
    };
  }, [propertyId]);

  const showError = (message) => {
    setSavedMessage("");
    setFormError(message);
    window.setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  const handleTypeChange = (nextType) => {
    const wasSharing = usesSharingRooms(type);
    const willShare = usesSharingRooms(nextType);
    if (wasSharing && !willShare) {
      const roomError = validatePgRooms(pgRooms);
      if (!roomError) setGenericRooms(sharingPayloadToGeneric(pgRooms));
    } else if (!wasSharing && willShare) {
      setPgRooms(dbRoomsToPgForm(genericRooms));
    }
    setType(nextType);
  };

  const addFacility = () => {
    const value = facilityInput.trim();
    if (!value || facilities.includes(value)) {
      setFacilityInput("");
      return;
    }
    setFacilities([...facilities, value]);
    setFacilityInput("");
  };

  const updateGenericRoom = (index, patch) => {
    setGenericRooms((current) =>
      current.map((room, roomIndex) => (roomIndex === index ? { ...room, ...patch } : room))
    );
  };

  const validateGenericRooms = () => {
    if (!genericRooms.length) return "Add at least one room.";

    for (let index = 0; index < genericRooms.length; index += 1) {
      const room = genericRooms[index];
      const label = room.room_type?.trim() || `Room ${index + 1}`;
      if (!room.room_type?.trim()) return `Enter a name for Room ${index + 1}.`;

      const monthly = room.price_value === "" ? null : Number(room.price_value);
      const nightly = room.daily_price === "" || room.daily_price == null ? null : Number(room.daily_price);
      const hasMonthly = Number.isFinite(monthly) && monthly > 0;
      const hasNightly = Number.isFinite(nightly) && nightly > 0;

      if (!hasMonthly && !hasNightly) {
        return `Enter a monthly rent or a nightly rate for ${label}. A room charged only per night can keep monthly rent at 0.`;
      }

      const people = Number(room.room_people);
      const count = Number(room.available_rooms);
      if (!Number.isFinite(people) || people < 1) return `People sharing must be at least 1 for ${label}.`;
      if (!Number.isFinite(count) || count < 0) return `Available rooms cannot be negative for ${label}.`;
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSavedMessage("");

    if (!name.trim()) {
      showError("Enter the property name.");
      return;
    }
    if (!location.trim()) {
      showError("Enter the location.");
      return;
    }
    if (!ownerName.trim()) {
      showError("Enter the contact name.");
      return;
    }
    if (ownerPhone.replace(/\D/g, "").length !== 10) {
      showError("Enter a valid 10-digit mobile number.");
      return;
    }

    const sharing = usesSharingRooms(type);
    const roomError = sharing ? validatePgRooms(pgRooms) : validateGenericRooms();
    if (roomError) {
      showError(roomError);
      return;
    }

    const latitudeValue = latitude === "" ? null : Number(latitude);
    const longitudeValue = longitude === "" ? null : Number(longitude);
    if (latitudeValue != null && !Number.isFinite(latitudeValue)) {
      showError("Latitude must be a number.");
      return;
    }
    if (longitudeValue != null && !Number.isFinite(longitudeValue)) {
      showError("Longitude must be a number.");
      return;
    }

    const roomTypeInputs = sharing
      ? pgRoomsToPayload(pgRooms)
      : genericRooms.map((room) => ({
          ...room,
          room_type: room.room_type.trim(),
          rent: room.price_value === "" ? 0 : Number(room.price_value),
          price_value: room.price_value === "" ? 0 : Number(room.price_value),
          daily_price: room.daily_price === "" || room.daily_price == null ? null : Number(room.daily_price),
          people: Number(room.room_people) || 1,
          available: Number(room.available_rooms) || 0,
          totalRooms: Number(room.available_rooms) || 0,
          details: room.room_details || {},
        }));

    setSubmitting(true);
    try {
      const { success, error } = await saveAdminProperty({
        propertyId,
        buildingCore: {
          name: name.trim(),
          location: location.trim(),
          type,
          description: description.trim(),
          rules: textToRules(rules),
          facilities,
          images,
          owner_name: ownerName.trim(),
          owner_phone: ownerPhone.trim(),
          owner_alt_phone: ownerAltPhone.trim() || null,
          owner_email: ownerEmail.trim() || null,
          latitude: latitudeValue,
          longitude: longitudeValue,
        },
        roomTypeInputs,
      });

      if (!success) throw error || new Error("Failed to save this property.");

      const refreshed = await fetchAdminProperty(propertyId);
      if (refreshed.error || !refreshed.data) {
        throw refreshed.error || new Error("Saved, but the updated property could not be reloaded.");
      }
      applyProperty(refreshed.data);
      setSavedMessage("Property saved. The listing now uses these details.");
      window.setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    } catch (error) {
      showError(error.message || error.details || "Failed to save this property.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      <AdminHeader
        title="Edit Property"
        subtitle="Update the listing details, photos, contact, and rooms. The current approval status stays as it is."
        onToggleMobileMenu={onToggleMobileMenu}
      />

      {loading ? (
        <p className="no-data-msg">Loading property...</p>
      ) : missing ? (
        <div className="wizard-card">
          <p>{formError || "Property not found."}</p>
          <Link to={PATHS.ADMIN_PROPERTIES} className="action-btn view-btn">
            Back to properties
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="admin-alert admin-alert-error" role="alert">
              {formError}
            </div>
          )}

          <div className="wizard-card">
            <h2>Property details</h2>
            <p className="wizard-card-lead">Name, category, location, and description shown to renters.</p>
            <div className="wizard-form-grid">
              <div className="wizard-form-group">
                <label htmlFor="adminPropName">Property name *</label>
                <input id="adminPropName" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminPropType">Type</label>
                <select id="adminPropType" value={type} onChange={(event) => handleTypeChange(event.target.value)}>
                  {!PROPERTY_TYPES.includes(type) && <option value={type}>{type}</option>}
                  {PROPERTY_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="wizard-form-group full">
                <label htmlFor="adminPropLocation">Location *</label>
                <input
                  id="adminPropLocation"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </div>
              <div className="wizard-form-group full">
                <label htmlFor="adminPropDescription">Description</label>
                <textarea
                  id="adminPropDescription"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="wizard-form-group full">
                <label htmlFor="adminPropRules">Rules</label>
                <textarea
                  id="adminPropRules"
                  rows={4}
                  value={rules}
                  onChange={(event) => setRules(event.target.value)}
                  placeholder="One rule per line"
                />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminPropLat">Latitude</label>
                <input
                  id="adminPropLat"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminPropLng">Longitude</label>
                <input
                  id="adminPropLng"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="wizard-card">
            <h2>Facilities</h2>
            <p className="wizard-card-lead">Add or remove the amenities stored on this listing.</p>
            <div className="wizard-form-grid">
              <div className="wizard-form-group">
                <label htmlFor="adminFacility">Add a facility</label>
                <input
                  id="adminFacility"
                  value={facilityInput}
                  onChange={(event) => setFacilityInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addFacility();
                    }
                  }}
                  placeholder="e.g. Wi-Fi"
                />
              </div>
              <div className="wizard-form-group" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="action-btn view-btn" onClick={addFacility}>
                  Add facility
                </button>
              </div>
            </div>
            {facilities.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {facilities.map((facility) => (
                  <span key={facility} className="badge-type">
                    {facility}
                    <button
                      type="button"
                      onClick={() => setFacilities(facilities.filter((item) => item !== facility))}
                      aria-label={`Remove ${facility}`}
                      style={{
                        marginLeft: "8px",
                        border: "none",
                        background: "none",
                        color: "inherit",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="wizard-card">
            <h2>Photos</h2>
            <ImageUploader images={images} onImagesChange={setImages} userId={user?.id} maxCount={36} />
          </div>

          <div className="wizard-card">
            <h2>Contact</h2>
            <div className="wizard-form-grid">
              <div className="wizard-form-group">
                <label htmlFor="adminOwnerName">Contact name *</label>
                <input
                  id="adminOwnerName"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminOwnerPhone">Mobile *</label>
                <input
                  id="adminOwnerPhone"
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(event.target.value)}
                />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminOwnerAlt">Alternative phone</label>
                <input
                  id="adminOwnerAlt"
                  value={ownerAltPhone}
                  onChange={(event) => setOwnerAltPhone(event.target.value)}
                />
              </div>
              <div className="wizard-form-group">
                <label htmlFor="adminOwnerEmail">Email</label>
                <input
                  id="adminOwnerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="wizard-card">
            <h2>Rooms and pricing</h2>
            {usesSharingRooms(type) ? (
              <>
                <p className="wizard-card-lead">
                  One physical room can be offered as single, double, triple, or four sharing.
                </p>
                <PgRoomOptions rooms={pgRooms} onChange={setPgRooms} />
              </>
            ) : (
              <>
                <p className="wizard-card-lead">Edit each room or rate offered on this listing.</p>
                <div className="room-manager-container">
                  {genericRooms.map((room, index) => (
                    <div key={room.id || index} className="room-type-card">
                      <div className="room-type-card-header">
                        <h4>{room.room_type?.trim() || `Room ${index + 1}`}</h4>
                        {genericRooms.length > 1 && (
                          <button
                            type="button"
                            className="room-type-remove-btn"
                            onClick={() =>
                              setGenericRooms(genericRooms.filter((_, roomIndex) => roomIndex !== index))
                            }
                          >
                            ✕ Remove Room
                          </button>
                        )}
                      </div>
                      <div className="wizard-form-grid">
                        <div className="wizard-form-group">
                          <label>Room name</label>
                          <input
                            value={room.room_type}
                            onChange={(event) => updateGenericRoom(index, { room_type: event.target.value })}
                          />
                        </div>
                        <div className="wizard-form-group">
                          <label>Monthly rent (₹)</label>
                          <small>Use 0 when this room is charged per night only.</small>
                          <input
                            type="number"
                            min="0"
                            value={room.price_value}
                            onChange={(event) => updateGenericRoom(index, { price_value: event.target.value })}
                          />
                        </div>
                        <div className="wizard-form-group">
                          <label>Nightly rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={room.daily_price ?? ""}
                            onChange={(event) => updateGenericRoom(index, { daily_price: event.target.value })}
                          />
                        </div>
                        <div className="wizard-form-group">
                          <label>People</label>
                          <input
                            type="number"
                            min="1"
                            value={room.room_people}
                            onChange={(event) => updateGenericRoom(index, { room_people: event.target.value })}
                          />
                        </div>
                        <div className="wizard-form-group">
                          <label>Available rooms</label>
                          <input
                            type="number"
                            min="0"
                            value={room.available_rooms}
                            onChange={(event) => updateGenericRoom(index, { available_rooms: event.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="owner-action-btn view pg-add-room-btn"
                    onClick={() => setGenericRooms([...genericRooms, emptyGenericRoom()])}
                  >
                    + Add another room
                  </button>
                </div>
              </>
            )}
          </div>

          {(formError || savedMessage) && (
            <div
              ref={errorRef}
              className={`admin-alert ${formError ? "admin-alert-error" : "admin-alert-success"}`}
              role="alert"
            >
              {formError || savedMessage}
            </div>
          )}

          <div className="admin-edit-actions">
            <Link to={PATHS.ADMIN_PROPERTIES} className="action-btn view-btn">
              Cancel
            </Link>
            <button type="submit" className="action-btn edit-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Save property"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
