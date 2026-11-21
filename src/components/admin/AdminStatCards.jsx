import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  KeyRound,
  UserCheck,
  Inbox,
  Star,
  ArrowUpRight,
} from "lucide-react";
import { PATHS } from "../../routes/paths.js";

export function AdminStatCards({ stats }) {
  if (!stats) return null;

  const items = [
    {
      title: "Total Properties",
      value: stats.totalProperties ?? 0,
      icon: Building2,
      color: "#22577a",
      link: PATHS.ADMIN_PROPERTIES,
      badge: "All Listings",
    },
    {
      title: "Verified Properties",
      value: stats.verifiedProperties ?? 0,
      icon: CheckCircle2,
      color: "#38a3a5",
      link: `${PATHS.ADMIN_PROPERTIES}?verification=live`,
      badge: "Live on Site",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingProperties ?? 0,
      icon: Clock,
      color: "#d97706",
      link: `${PATHS.ADMIN_PROPERTIES}?verification=pending`,
      badge: "Action Required",
      highlight: (stats.pendingProperties ?? 0) > 0,
    },
    {
      title: "Registered Users",
      value: stats.totalUsers ?? 0,
      icon: Users,
      color: "#4f46e5",
      link: PATHS.ADMIN_PROFILES,
      badge: "Total Accounts",
    },
    {
      title: "Property Owners",
      value: stats.totalOwners ?? 0,
      icon: KeyRound,
      color: "#7c3aed",
      link: `${PATHS.ADMIN_PROFILES}?role=owner`,
      badge: "Hosts & Owners",
    },
    {
      title: "Verified Agents",
      value: stats.totalAgents ?? 0,
      icon: UserCheck,
      color: "#059669",
      link: PATHS.ADMIN_AGENTS,
      badge: "Field Agents",
    },
    {
      title: "Tenant Enquiries",
      value: stats.totalEnquiries ?? 0,
      icon: Inbox,
      color: "#db2777",
      link: PATHS.ADMIN_ENQUIRIES,
      badge: "Inbound Leads",
    },
    {
      title: "Customer Reviews",
      value: stats.totalReviews ?? 0,
      icon: Star,
      color: "#ca8a04",
      link: PATHS.ADMIN_REVIEWS,
      badge: "User Ratings",
    },
  ];

  return (
    <div className="stats-grid" role="region" aria-label="Quick metrics overview">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            to={item.link}
            className={`stat-card stat-card-clickable ${item.highlight ? "stat-card-highlight" : ""}`}
            title={`View ${item.title}`}
          >
            <div className="stat-card-top">
              <div
                className="stat-icon"
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  borderColor: `${item.color}30`,
                }}
              >
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <span className="stat-action-indicator" aria-hidden="true">
                <ArrowUpRight size={16} />
              </span>
            </div>

            <div className="stat-info">
              <span className="stat-label">{item.title}</span>
              <strong className="stat-value">{item.value.toLocaleString()}</strong>
              {item.badge && <span className="stat-badge">{item.badge}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default AdminStatCards;
