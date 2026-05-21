import Icon from "./Icon";

type Props = { size?: "sm" | "md" | "lg" };

export default function Logo({ size = "md" }: Props) {
  const px = size === "sm" ? 16 : size === "lg" ? 22 : 19;
  return (
    <div className="cs-logo" style={{ fontSize: px }}>
      <span className="cs-logo-mark" style={{ width: px + 9, height: px + 9 }}>
        <Icon name="tree" size={Math.round(px * 0.7)} strokeWidth={1.8} />
      </span>
      <span>CampSearch</span>
    </div>
  );
}
