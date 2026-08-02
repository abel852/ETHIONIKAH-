export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0a1a]">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Logo with pulse + float */}
      <div className="relative flex flex-col items-center gap-6">
        <div
          className="relative animate-[logoFloat_3s_ease-in-out_infinite]"
          style={{ animationName: "logoFloat" }}
        >
          {/* Gold ring spinner */}
          <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-[#D4AF37] border-r-[#D4AF37]/30 animate-spin" style={{ animationDuration: "1.2s" }} />

          {/* Logo SVG */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]/20">
            <img
              src="/application.png"
              alt="Ethio Nikah"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* App name */}
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-xl font-bold tracking-wide text-white">
            Ethio<span className="text-[#D4AF37]">Nikah</span>
          </h1>
          <p className="text-[11px] font-medium tracking-widest uppercase text-[#8B8B8B]">
            Islamic Matchmaking
          </p>
        </div>

        {/* Three-dot loading indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
              style={{
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
