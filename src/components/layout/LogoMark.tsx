export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-[14px] bg-ink text-bg shadow-soft"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="5" width="17" height="15" rx="4.5" stroke="currentColor" strokeWidth="2" />
        <path d="M3.5 10h17M8 2.8v3.6M16 2.8v3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="15.5" cy="15" r="1.8" fill="var(--accent)" />
      </svg>
    </span>
  )
}
