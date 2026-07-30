import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "6px",
          fontSize: "18px",
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
