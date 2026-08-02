export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        animation: "pageIn 0.25s ease-out",
      }}
    >
      {children}
      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
