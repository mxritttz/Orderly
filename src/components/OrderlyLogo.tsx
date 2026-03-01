import orderlyLogo from "../assets/orderly-logo.svg";

type OrderlyLogoProps = {
  width?: number | string;
  className?: string;
};

export default function OrderlyLogo({ width = 240, className }: OrderlyLogoProps) {
  return (
    <img
      src={orderlyLogo}
      alt="Orderly"
      width={typeof width === "number" ? width : undefined}
      style={typeof width === "string" ? { width, height: "auto" } : { height: "auto" }}
      className={className}
    />
  );
}
