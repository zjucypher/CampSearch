type Props = { data: number[]; color?: string };

export default function Sparkline({ data, color = "var(--accent)" }: Props) {
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${32 - (v / max) * 28}`)
    .join(" ");
  return (
    <svg className="cs-spark" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
