import React from "react";
import { BedDouble, Hotel, Building2, PartyPopper, Store, LayoutGrid } from "lucide-react";

/**
 * Universal Category Icon component using Lucide icons.
 * Replaces legacy emojis with crisp SVG vector icons.
 */
export function CategoryIcon({ categoryId, size = 18, className = "" }) {
  const cid = String(categoryId || "").toLowerCase();
  if (cid.includes("pg") || cid.includes("hostel")) {
    return <BedDouble size={size} className={className} />;
  }
  if (cid.includes("hotel") || cid.includes("resort") || cid.includes("stay") || cid.includes("lodge") || cid.includes("guest")) {
    return <Hotel size={size} className={className} />;
  }
  if (cid.includes("flat") || cid.includes("apartment") || cid.includes("house") || cid.includes("rental")) {
    return <Building2 size={size} className={className} />;
  }
  if (cid.includes("event") || cid.includes("hall") || cid.includes("banquet") || cid.includes("venue")) {
    return <PartyPopper size={size} className={className} />;
  }
  if (
    cid.includes("commercial") ||
    cid.includes("shop") ||
    cid.includes("office") ||
    cid.includes("warehouse") ||
    cid.includes("godown") ||
    cid.includes("showroom") ||
    cid.includes("industrial")
  ) {
    return <Store size={size} className={className} />;
  }
  return <LayoutGrid size={size} className={className} />;
}

export default CategoryIcon;
