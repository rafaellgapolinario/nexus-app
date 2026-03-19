'use client'
export function NexusIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#60a5fa"/>
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="8" fill="url(#ng)"/>
      <line x1="36" y1="28" x2="36" y2="10" stroke="url(#ng)" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="36" cy="8" r="4" fill="url(#ng)"/>
      <line x1="36" y1="44" x2="36" y2="62" stroke="url(#ng)" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="36" cy="64" r="4" fill="url(#ng)"/>
      <line x1="28" y1="36" x2="10" y2="36" stroke="url(#ng)" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="8" cy="36" r="4" fill="url(#ng)"/>
      <line x1="44" y1="36" x2="62" y2="36" stroke="url(#ng)" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="64" cy="36" r="4" fill="url(#ng)"/>
      <line x1="30" y1="30" x2="17" y2="17" stroke="url(#ng)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="3.5" fill="url(#ng)"/>
      <line x1="42" y1="30" x2="55" y2="17" stroke="url(#ng)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="58" cy="14" r="3.5" fill="url(#ng)"/>
      <line x1="30" y1="42" x2="17" y2="55" stroke="url(#ng)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="58" r="3.5" fill="url(#ng)"/>
      <line x1="42" y1="42" x2="55" y2="55" stroke="url(#ng)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="58" cy="58" r="3.5" fill="url(#ng)"/>
    </svg>
  )
}
