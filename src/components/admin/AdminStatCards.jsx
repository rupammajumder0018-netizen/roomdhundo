import React from "react";

export function AdminStatCards({ stats }) {
  if (!stats) return null;

  const items = [
    {
      title: "Total Properties",
      value: stats.totalProperties ?? 0,
      icon: "🏠",
      color: "#22577A",
    },
    {
      title: "Verified Properties",
      value: stats.verifiedProperties ?? 0,
      icon: "✅",
      color: "#38A3A5",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingProperties ?? 0,
      icon: "⏳",
      color: "#f59e0b",
    },
    {
      title: "Registered Users",
      value: stats.totalUsers ?? 0,
      icon: "👤",
      color: "#6366f1",
    },
    {
      title: "Property Owners",
      value: stats.totalOwners ?? 0,
      icon: "🔑",
      color: "#8b5cf6",
    },
    {
      title: "Verified Agents",
      value: stats.totalAgents ?? 0,
      icon: "🤝",
      color: "#10b981",
    },
    {
      title: "Tenant Enquiries",
      value: stats.totalEnquiries ?? 0,
      icon: "📩",
      color: "#ec4899",
    },
    {
      title: "Customer Reviews",
      value: stats.totalReviews ?? 0,
      icon: "⭐",
      color: "#eab308",
    },
  ];

  return (
    <div className="stats-grid">
      {items.map((item) => (
        <div key={item.title} className="stat-card">
          <div
            className="stat-icon"
            style={{ backgroundColor: `${item.color}15`, color: item.color }}
          >
            {item.icon}
          </div>
          <div className="stat-info">
            <span className="stat-label">{item.title}</span>
            <strong className="stat-value">{item.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminStatCards;
