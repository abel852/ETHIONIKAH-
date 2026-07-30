import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #D4AF37, #B8860B)",
          borderRadius: "40px",
          fontSize: "90px",
          fontWeight: 700,
          color: "#0c0a1a",
          fontFamily: "serif",
        }}
      >
        EN
      </div>
    ),
    { ...size }
  );
}
