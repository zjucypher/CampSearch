"use client";

import Icon from "./Icon";

type Props = {
  open: boolean;
  campgroundName: string;
  siteName: string;
  arriveDate: string;
  departDate: string;
  bookingUrl: string;
  onDismiss: () => void;
  onBook: () => void;
};

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Toast({ open, campgroundName, siteName, arriveDate, departDate, bookingUrl, onDismiss, onBook }: Props) {
  if (!open) return null;
  const dateRange = arriveDate && departDate ? `${fmtDate(arriveDate)} – ${fmtDate(departDate)} · ` : "";
  return (
    <div className="cs-toast">
      <div className="cs-toast-icon">
        <Icon name="bell" size={18} strokeWidth={2.2} />
      </div>
      <div className="cs-toast-body">
        <div className="cs-toast-title">{campgroundName}{siteName ? ` · ${siteName}` : ""} just opened</div>
        <div className="cs-toast-sub">{dateRange}matches your alert · book within minutes</div>
      </div>
      <a
        href={bookingUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="cs-toast-cta"
        onClick={onDismiss}
      >
        Book →
      </a>
      <button
        onClick={onDismiss}
        style={{ background: "transparent", border: "none", color: "currentColor", opacity: 0.5, cursor: "pointer" }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
