import type { CSSProperties } from "react";

type Props = {
  label?: string;
  height?: number | string;
  style?: CSSProperties;
  className?: string;
};

export default function Photo({ label = "photo", height = 200, style, className }: Props) {
  return (
    <div className={`cs-photo${className ? ` ${className}` : ""}`} style={{ height, ...style }}>
      <span>{label}</span>
    </div>
  );
}
