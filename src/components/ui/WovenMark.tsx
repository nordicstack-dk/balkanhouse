/** Placeholder mark for products without a photo. */
export function WovenMark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 2 L30 16 L16 30 L2 16 Z" />
      <path d="M16 9 L23 16 L16 23 L9 16 Z" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  )
}
