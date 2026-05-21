"use client";

import Icon from "./Icon";

type Props = {
  open: boolean;
  onDismiss: () => void;
  onView: () => void;
};

export default function Toast({ open, onDismiss, onView }: Props) {
  if (!open) return null;
  return (
    <div className="cs-toast">
      <div className="cs-toast-icon">
        <Icon name="bell" size={18} strokeWidth={2.2} />
      </div>
      <div className="cs-toast-body">
        <div className="cs-toast-title">Upper Pines · Site 14 just opened</div>
        <div className="cs-toast-sub">Jul 18 – 20, 2026 · matches your alert · book within minutes</div>
      </div>
      <button className="cs-toast-cta" onClick={onView}>Book →</button>
      <button
        onClick={onDismiss}
        style={{ background: "transparent", border: "none", color: "currentColor", opacity: 0.5, cursor: "pointer" }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
