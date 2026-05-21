"use client";

type Props = { on: boolean; onChange: (v: boolean) => void };

export default function CsSwitch({ on, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="cs-switch"
      data-checked={String(on)}
      onClick={() => onChange(!on)}
    />
  );
}
