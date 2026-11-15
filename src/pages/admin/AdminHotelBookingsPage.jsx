import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchAllHotelBookings,
  calculateHotelBookingStats,
  checkOverlappingConfirmedBookings,
  adminUpdateHotelBooking,
  HOTEL_BOOKING_STATUS,
} from "../../services/bookings/index.js";
import { useAuth } from "../../hooks/useAuth.js";

const PAGE_SIZES = [10, 25, 50];

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

function shortId(id) {
  if (!id) return "----";
  return `#${String(id).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function validDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const d = validDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatShortDate(value) {
  const d = validDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(value) {
  const d = validDate(value);
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function toLocalInput(value) {
  const d = validDate(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function sameDay(value, compare = new Date()) {
  const d = validDate(value);
  if (!d) return false;
  return (
    d.getFullYear() === compare.getFullYear() &&
    d.getMonth() === compare.getMonth() &&
    d.getDate() === compare.getDate()
  );
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function phoneHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `tel:${digits}` : "";
}

function waHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

function stayUnits(row, startIso, endIso) {
  const start = validDate(startIso || row.check_in);
  const end = validDate(endIso || row.check_out);
  if (!start || !end || end <= start) return 1;
  if ((row.booking_mode || "nightly") === "hourly") {
    return Math.max(1, Math.ceil((end - start) / 3600000));
  }
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

function stayLabel(row) {
  const hourly = (row.booking_mode || "nightly") === "hourly";
  const units = hourly
    ? row.hours_count || stayUnits(row)
    : row.nights_count || stayUnits(row);
  const unitWord = hourly
    ? units === 1
      ? "hour"
      : "hours"
    : units === 1
    ? "night"
    : "nights";
  return `${formatShortDate(row.check_in)} → ${formatShortDate(row.check_out)} · ${units} ${unitWord}`;
}

export function AdminHotelBookingsPage() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pauseRefresh, setPauseRefresh] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hotelFilter, setHotelFilter] = useState("");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [activeStat, setActiveStat] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Overlays
  const [openMenuId, setOpenMenuId] = useState(null);
  const [drawerRow, setDrawerRow] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Drawer Form State
  const [drawerStatus, setDrawerStatus] = useState("pending");
  const [drawerCheckIn, setDrawerCheckIn] = useState("");
  const [drawerCheckOut, setDrawerCheckOut] = useState("");
  const [drawerPrice, setDrawerPrice] = useState(0);
  const [drawerAdminNote, setDrawerAdminNote] = useState("");
  const [isPriceManual, setIsPriceManual] = useState(false);
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchErr } = await fetchAllHotelBookings();
      if (fetchErr) {
        setError(fetchErr.message || "Could not load hotel bookings.");
      } else {
        setRows(data || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic Auto-refresh (60s)
  useEffect(() => {
    if (pauseRefresh) return;
    const timer = setInterval(() => {
      if (!document.hidden && !drawerRow) {
        loadData();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [pauseRefresh, drawerRow, loadData]);

  // Unique Hotels list for dropdown filter
  const hotelNames = useMemo(() => {
    return [...new Set(rows.map((r) => r.buildings?.name).filter(Boolean))].sort();
  }, [rows]);

  // Overall stats
  const stats = useMemo(() => {
    return calculateHotelBookingStats(rows);
  }, [rows]);

  // Filtered and Sorted rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      // Stat chip filter
      if (activeStat === "checkin-today" && !sameDay(row.check_in)) return false;
      if (activeStat === "revenue" && row.status !== "confirmed") return false;
      if (activeStat === "closed" && !["rejected", "cancelled"].includes(row.status)) return false;
      if (["pending", "confirmed"].includes(activeStat) && row.status !== activeStat) return false;

      // Status dropdown filter
      if (statusFilter === "closed") {
        if (!["rejected", "cancelled"].includes(row.status)) return false;
      } else if (statusFilter && row.status !== statusFilter) {
        return false;
      }

      // Hotel dropdown filter
      if (hotelFilter && (row.buildings?.name || "") !== hotelFilter) return false;

      // Dates filter
      const checkIn = validDate(row.check_in);
      if (checkInFrom && checkIn && checkIn < new Date(`${checkInFrom}T00:00:00`)) return false;
      if (checkInTo && checkIn && checkIn > new Date(`${checkInTo}T23:59:59`)) return false;

      // Free-text search
      if (!q) return true;
      const ownerName = row._owner?.full_name || row._owner?.name || row.buildings?.owner_name || "";
      const ownerPhone = row._owner?.phone || row._owner?.contact_phone || row.buildings?.owner_phone || "";
      const haystack = [
        row.id,
        shortId(row.id),
        row.guest_name,
        row.guest_phone,
        row.buildings?.name,
        row.room_types?.room_type,
        ownerName,
        ownerPhone,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortOrder === "checkin") return (validDate(a.check_in) || 0) - (validDate(b.check_in) || 0);
      if (sortOrder === "price-high") return Number(b.total_price || 0) - Number(a.total_price || 0);
      if (sortOrder === "price-low") return Number(a.total_price || 0) - Number(b.total_price || 0);
      return (validDate(b.created_at) || 0) - (validDate(a.created_at) || 0);
    });

    return filtered;
  }, [rows, activeStat, statusFilter, hotelFilter, checkInFrom, checkInTo, search, sortOrder]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Actions
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setHotelFilter("");
    setCheckInFrom("");
    setCheckInTo("");
    setSortOrder("newest");
    setActiveStat("all");
    setPage(1);
  };

  const handleQuickStatus = async (bookingId, targetStatus) => {
    const actionWord = targetStatus === "confirmed" ? "confirm" : targetStatus;
    const confirmMsg = `Are you sure you want to ${actionWord} this booking?`;
    if (!window.confirm(confirmMsg)) return;

    let note = "";
    if (["rejected", "cancelled"].includes(targetStatus)) {
      note = window.prompt("Reason for cancellation / rejection (optional):", "") || "";
    }

    try {
      const { error: updateErr } = await adminUpdateHotelBooking({
        bookingId,
        patch: {
          status: targetStatus,
          ...(note ? { admin_note: note } : {}),
        },
        updatedBy: user?.id,
      });

      if (updateErr) {
        showToast(`Could not update booking: ${updateErr.message}`, "error");
      } else {
        showToast(`Booking ${STATUS_LABEL[targetStatus] || targetStatus}.`);
        loadData();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text).then(
      () => showToast("Copied to clipboard."),
      () => showToast("Could not copy.", "error")
    );
  };

  const handleExportCsv = () => {
    const header = [
      "id",
      "guest_name",
      "guest_phone",
      "hotel",
      "room",
      "check_in",
      "check_out",
      "owner_name",
      "owner_phone",
      "total_price",
      "status",
    ];

    const lines = [header.join(",")];
    filteredRows.forEach((row) => {
      const ownerName = row._owner?.full_name || row._owner?.name || row.buildings?.owner_name || "";
      const ownerPhone = row._owner?.phone || row._owner?.contact_phone || row.buildings?.owner_phone || "";
      const values = [
        row.id,
        row.guest_name,
        row.guest_phone,
        row.buildings?.name,
        row.room_types?.room_type,
        row.check_in,
        row.check_out,
        ownerName,
        ownerPhone,
        row.total_price,
        row.status,
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
      lines.push(values.join(","));
    });

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hotel-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully.");
  };

  // Open Drawer
  const openDrawer = (row) => {
    setDrawerRow(row);
    setDrawerStatus(row.status || "pending");
    setDrawerCheckIn(toLocalInput(row.check_in));
    setDrawerCheckOut(toLocalInput(row.check_out));
    setDrawerPrice(Number(row.total_price || 0));
    setDrawerAdminNote(row.admin_note || "");

    const computed = stayUnits(row) * Number(row.price_per_unit || 0);
    setIsPriceManual(Number(row.total_price || 0) !== computed);
  };

  const closeDrawer = () => {
    setDrawerRow(null);
  };

  // Handle drawer date change
  const handleDrawerDateChange = (newCheckIn, newCheckOut) => {
    setDrawerCheckIn(newCheckIn);
    setDrawerCheckOut(newCheckOut);

    if (!isPriceManual && drawerRow) {
      const units = stayUnits(drawerRow, newCheckIn, newCheckOut);
      const autoPrice = units * Number(drawerRow.price_per_unit || 0);
      setDrawerPrice(autoPrice);
    }
  };

  // Save Drawer Edits
  const handleSaveDrawer = async (e) => {
    e.preventDefault();
    if (!drawerRow) return;

    const start = new Date(drawerCheckIn);
    const end = new Date(drawerCheckOut);
    const total = Number(drawerPrice);

    if (!(end > start)) {
      showToast("Check-out must be after check-in.", "error");
      return;
    }

    if (!Number.isFinite(total) || total < 0) {
      showToast("Total price must be 0 or more.", "error");
      return;
    }

    // Overlap conflict detection if marking as confirmed
    if (drawerStatus === HOTEL_BOOKING_STATUS.CONFIRMED) {
      const { overlaps } = await checkOverlappingConfirmedBookings({
        roomTypeId: drawerRow.room_type_id,
        checkIn: start.toISOString(),
        checkOut: end.toISOString(),
        excludeBookingId: drawerRow.id,
      });

      if (overlaps.length > 0) {
        const proceed = window.confirm(
          `Notice: This room category already has ${overlaps.length} confirmed booking(s) overlapping with these dates. Save anyway?`
        );
        if (!proceed) return;
      }
    }

    setIsSavingDrawer(true);
    const hourlyMode = (drawerRow.booking_mode || "nightly") === "hourly";
    const units = stayUnits(drawerRow, drawerCheckIn, drawerCheckOut);

    const patch = {
      status: drawerStatus,
      check_in: start.toISOString(),
      check_out: end.toISOString(),
      total_price: total,
      hours_count: hourlyMode ? units : null,
      nights_count: hourlyMode ? null : units,
      admin_note: drawerAdminNote.trim() || null,
    };

    try {
      const { error: updateErr } = await adminUpdateHotelBooking({
        bookingId: drawerRow.id,
        patch,
        updatedBy: user?.id,
      });

      if (updateErr) {
        showToast(`Could not save: ${updateErr.message}`, "error");
      } else {
        showToast("Booking updated successfully.");
        closeDrawer();
        loadData();
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setIsSavingDrawer(false);
    }
  };

  return (
    <section className="admin-section" id="hotelBookingsSection">
      {/* STAT CARDS */}
      <div className="hb-stats" role="toolbar" aria-label="Hotel booking statistics">
        <button
          type="button"
          className={`hb-stat ${activeStat === "all" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("all");
            setStatusFilter("");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">📋</span>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </button>

        <button
          type="button"
          className={`hb-stat hb-stat-pending ${activeStat === "pending" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("pending");
            setStatusFilter("pending");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">⏳</span>
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </button>

        <button
          type="button"
          className={`hb-stat hb-stat-confirmed ${activeStat === "confirmed" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("confirmed");
            setStatusFilter("confirmed");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">✅</span>
          <span>Confirmed</span>
          <strong>{stats.confirmed}</strong>
        </button>

        <button
          type="button"
          className={`hb-stat hb-stat-closed ${activeStat === "closed" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("closed");
            setStatusFilter("closed");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">⛔</span>
          <span>Rejected / Cancelled</span>
          <strong>{stats.closed}</strong>
        </button>

        <button
          type="button"
          className={`hb-stat hb-stat-checkin ${activeStat === "checkin-today" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("checkin-today");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">🛎️</span>
          <span>Today's Check-ins</span>
          <strong>{stats.checkinsToday}</strong>
        </button>

        <button
          type="button"
          className={`hb-stat hb-stat-revenue ${activeStat === "revenue" ? "is-active" : ""}`}
          onClick={() => {
            setActiveStat("revenue");
            setPage(1);
          }}
        >
          <span className="hb-stat-icon" aria-hidden="true">₹</span>
          <span>Revenue</span>
          <strong>{formatMoney(stats.revenue)}</strong>
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="dashboard-card hb-card">
        <div className="hb-toolbar">
          <label className="hb-search">
            <input
              type="search"
              placeholder="🔍 Search guest, phone, hotel, owner, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setActiveStat(e.target.value || "all");
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={hotelFilter}
            onChange={(e) => {
              setHotelFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by hotel"
          >
            <option value="">All hotels</option>
            {hotelNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <label className="hb-date">
            <span>From</span>
            <input
              type="date"
              value={checkInFrom}
              onChange={(e) => {
                setCheckInFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Check-in from"
            />
          </label>

          <label className="hb-date">
            <span>To</span>
            <input
              type="date"
              value={checkInTo}
              onChange={(e) => {
                setCheckInTo(e.target.value);
                setPage(1);
              }}
              aria-label="Check-in to"
            />
          </label>

          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
            aria-label="Sort bookings"
          >
            <option value="newest">Newest first</option>
            <option value="checkin">Check-in date</option>
            <option value="price-high">Price high to low</option>
            <option value="price-low">Price low to high</option>
          </select>

          <button type="button" className="hb-btn" onClick={handleClearFilters}>
            Clear filters
          </button>

          <button type="button" className="hb-btn" onClick={loadData}>
            Refresh
          </button>

          <button type="button" className="hb-btn hb-btn-primary" onClick={handleExportCsv}>
            Export CSV
          </button>

          <label className="hb-pause">
            <input
              type="checkbox"
              checked={pauseRefresh}
              onChange={(e) => setPauseRefresh(e.target.checked)}
            />
            Pause auto-refresh
          </label>

          <p className="hb-updated">
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "Last updated —"}
          </p>
        </div>

        {/* BOOKINGS TABLE */}
        <div className="hb-table-wrap">
          <table className="hb-table">
            <thead>
              <tr>
                <th scope="col">Booking</th>
                <th scope="col">Guest</th>
                <th scope="col">Hotel / Room</th>
                <th scope="col">Stay</th>
                <th scope="col">Owner</th>
                <th scope="col" className="hb-num">Price</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="hb-skel">
                    <td colSpan="8"></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="8">
                    <div className="hb-error">
                      <p>{error}</p>
                      <button type="button" className="hb-btn hb-btn-primary" onClick={loadData}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="hb-empty">
                      No bookings match your filters. Try clearing search or date filters.
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const call = phoneHref(row.guest_phone);
                  const wa = waHref(row.guest_phone);
                  const ownerName =
                    row._owner?.full_name || row._owner?.name || row.buildings?.owner_name || "—";
                  const ownerPhone =
                    row._owner?.phone || row._owner?.contact_phone || row.buildings?.owner_phone || "";
                  const ownerTel = phoneHref(ownerPhone);

                  return (
                    <tr key={row.id}>
                      <td data-label="Booking">
                        <button
                          type="button"
                          className="hb-id"
                          title={row.id}
                          onClick={() => handleCopyText(row.id)}
                        >
                          {shortId(row.id)}
                        </button>
                      </td>

                      <td data-label="Guest">
                        <b>{row.guest_name || "Guest"}</b>
                        <span className="hb-muted">{row.guest_phone || "—"}</span>
                        <div className="hb-guest-links">
                          {call && (
                            <a className="hb-icon-btn" href={call} aria-label="Call guest">
                              📞
                            </a>
                          )}
                          {wa && (
                            <a
                              className="hb-icon-btn"
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp guest"
                            >
                              💬
                            </a>
                          )}
                        </div>
                      </td>

                      <td data-label="Hotel / Room">
                        <b>{row.buildings?.name || "Hotel"}</b>
                        <span className="hb-muted">{row.room_types?.room_type || "Room"}</span>
                      </td>

                      <td data-label="Stay">
                        <b>{stayLabel(row)}</b>
                        <span className="hb-muted">
                          {formatTime(row.check_in)} – {formatTime(row.check_out)}
                        </span>
                      </td>

                      <td data-label="Owner">
                        <b>{ownerName}</b>
                        <span className="hb-muted">{ownerPhone || "—"}</span>
                        {ownerTel && (
                          <div className="hb-guest-links">
                            <a className="hb-icon-btn" href={ownerTel} aria-label="Call owner">
                              📞
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="hb-num" data-label="Price">
                        <b>{formatMoney(row.total_price)}</b>
                        <span className="hb-muted">
                          {formatMoney(row.price_per_unit)} /{" "}
                          {(row.booking_mode || "nightly") === "hourly" ? "hour" : "night"}
                        </span>
                      </td>

                      <td data-label="Status">
                        <span className={`hb-status ${row.status || "pending"}`}>
                          {STATUS_LABEL[row.status] || row.status}
                        </span>
                      </td>

                      <td data-label="Actions">
                        <div className="hb-actions" style={{ position: "relative" }}>
                          {row.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="hb-action confirm"
                                onClick={() => handleQuickStatus(row.id, "confirmed")}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="hb-action reject"
                                onClick={() => handleQuickStatus(row.id, "rejected")}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="hb-action"
                            onClick={() => openDrawer(row)}
                          >
                            View / Edit
                          </button>

                          <button
                            type="button"
                            className="hb-icon-btn"
                            aria-label="More actions"
                            onClick={() =>
                              setOpenMenuId(openMenuId === row.id ? null : row.id)
                            }
                          >
                            ⋯
                          </button>

                          {openMenuId === row.id && (
                            <div className="hb-menu" role="menu">
                              {row.status !== "cancelled" && row.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleQuickStatus(row.id, "cancelled");
                                  }}
                                >
                                  Cancel Booking
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleCopyText(
                                    `Booking ${shortId(row.id)}\nGuest: ${row.guest_name} (${row.guest_phone})\nHotel: ${row.buildings?.name} - ${row.room_types?.room_type}\nStay: ${stayLabel(row)}\nTotal: ${formatMoney(row.total_price)}`
                                  );
                                }}
                              >
                                Copy details
                              </button>
                              {call && (
                                <a href={call} onClick={() => setOpenMenuId(null)}>
                                  Contact guest
                                </a>
                              )}
                              {ownerTel && (
                                <a href={ownerTel} onClick={() => setOpenMenuId(null)}>
                                  Contact owner
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredRows.length > 0 && (
          <div className="hb-pager">
            <span>
              Showing {Math.min(filteredRows.length, (currentPage - 1) * pageSize + 1)}–
              {Math.min(filteredRows.length, currentPage * pageSize)} of {filteredRows.length}
            </span>

            <div className="hb-pager-btns">
              <button
                type="button"
                className="hb-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span>
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="hb-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW / EDIT DRAWER */}
      {drawerRow && (
        <>
          <div className="hb-drawer-back" onClick={closeDrawer} />
          <div className="hb-drawer" role="dialog" aria-modal="true">
            <div className="hb-drawer-head">
              <div>
                <h2>Booking {shortId(drawerRow.id)}</h2>
                <p className="hb-muted">
                  {STATUS_LABEL[drawerRow.status] || drawerRow.status}
                </p>
              </div>
              <button type="button" className="hb-btn" onClick={closeDrawer}>
                Close
              </button>
            </div>

            <dl>
              <dt>Guest</dt>
              <dd>
                {drawerRow.guest_name || "—"}
                <br />
                {drawerRow.guest_phone || "—"}
              </dd>
              <dt>Hotel / Room</dt>
              <dd>
                {drawerRow.buildings?.name || "Hotel"}
                <br />
                {drawerRow.room_types?.room_type || "Room"}
              </dd>
              <dt>Stay Type</dt>
              <dd>{stayLabel(drawerRow)}</dd>
              <dt>Guests</dt>
              <dd>{drawerRow.guest_count || 1}</dd>
              <dt>Created</dt>
              <dd>
                {formatDate(drawerRow.created_at)} {formatTime(drawerRow.created_at)}
              </dd>
              <dt>Original Price</dt>
              <dd>
                {formatMoney(drawerRow.total_price)} ·{" "}
                {formatMoney(drawerRow.price_per_unit)} /{" "}
                {(drawerRow.booking_mode || "nightly") === "hourly" ? "hour" : "night"}
              </dd>
            </dl>

            <form className="hb-form" onSubmit={handleSaveDrawer}>
              <label>
                Status
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value)}
                >
                  {Object.keys(STATUS_LABEL).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABEL[st]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Check-in
                <input
                  type="datetime-local"
                  value={drawerCheckIn}
                  onChange={(e) => handleDrawerDateChange(e.target.value, drawerCheckOut)}
                  required
                />
              </label>

              <label>
                Check-out
                <input
                  type="datetime-local"
                  value={drawerCheckOut}
                  onChange={(e) => handleDrawerDateChange(drawerCheckIn, e.target.value)}
                  required
                />
              </label>

              <label>
                Total Price (₹)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={drawerPrice}
                  onChange={(e) => {
                    setDrawerPrice(Number(e.target.value));
                    setIsPriceManual(true);
                  }}
                  required
                />
              </label>

              {isPriceManual && (
                <p className="hb-note">Price was manually edited.</p>
              )}

              <label>
                Admin Note
                <textarea
                  rows="3"
                  value={drawerAdminNote}
                  onChange={(e) => setDrawerAdminNote(e.target.value)}
                  placeholder="Internal notes or reason for status changes..."
                />
              </label>

              <div className="hb-drawer-actions">
                <button type="button" className="hb-btn" onClick={closeDrawer}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hb-btn hb-btn-primary"
                  disabled={isSavingDrawer}
                >
                  {isSavingDrawer ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* TOASTS */}
      {toastMessage && (
        <div className="hb-toasts" role="status">
          <div className={`hb-toast ${toastMessage.type}`}>{toastMessage.message}</div>
        </div>
      )}
    </section>
  );
}

export default AdminHotelBookingsPage;
