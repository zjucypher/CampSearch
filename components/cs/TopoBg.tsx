type Props = { opacity?: number; color?: string };

export default function TopoBg({ opacity = 0.35, color = "currentColor" }: Props) {
  return (
    <svg
      className="cs-topo-bg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 600"
      style={{ opacity, color }}
    >
      <defs>
        <pattern id="topo" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M -20 240 Q 80 200 160 240 T 320 230 T 440 250"/>
            <path d="M -20 220 Q 80 170 160 215 T 320 200 T 440 230"/>
            <path d="M -20 200 Q 80 140 160 190 T 320 175 T 440 215"/>
            <path d="M -20 180 Q 80 115 160 165 T 320 150 T 440 200"/>
            <path d="M -20 160 Q 80 90 160 140 T 320 130 T 440 185"/>
            <path d="M -20 140 Q 80 70 160 120 T 320 110 T 440 170"/>
            <path d="M -20 120 Q 80 55 160 100 T 320 95 T 440 158"/>
            <path d="M -20 100 Q 80 45 160 85 T 320 82 T 440 145"/>
            <path d="M -20 280 Q 80 250 160 285 T 320 280 T 440 290"/>
            <path d="M -20 310 Q 80 295 160 320 T 320 320 T 440 325"/>
            <path d="M -20 340 Q 80 340 160 355 T 320 360 T 440 360"/>
          </g>
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#topo)" />
    </svg>
  );
}
