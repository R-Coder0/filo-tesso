// TrustStrip.jsx

const badges = [
  {
    label: "Cash on Delivery",
    sub: "Pay when you receive",
    icon: (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M4 11h20" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="7" y="14.5" width="6" height="2.5" rx="1" fill="currentColor" opacity="0.5"/>
        <circle cx="20.5" cy="15.75" r="2" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    label: "Fast Delivery",
    sub: "Quick & reliable shipping",
    icon: (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <path d="M5 14c0-5 3-8 9-8s9 3 9 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="4" y="13" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="20" y="13" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M20 20c0 2-1.5 3-3 3h-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "7-Day Returns",
    sub: "Hassle-free return policy",
    icon: (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <path d="M14 5l2 4 5 .5-3.5 3.5 1 5L14 16l-4.5 2 1-5L7 9.5l5-.5 2-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M10 19l-3 4M18 19l3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "100% Genuine",
    sub: "Authentic products only",
    icon: (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <path d="M14 4l7 3v7c0 4-3 7-7 9-4-2-7-5-7-9V7l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M10.5 14l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function TrustStrip() {
  return (
    <div className="w-full border-y border-gray-200 bg-white py-3">
      <div className="flex flex-wrap items-center justify-center divide-x divide-gray-200">
        {badges.map((badge, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-2 flex-1 min-w-[150px] max-w-[260px]"
          >
            <div className="text-gray-700 shrink-0">{badge.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-800 leading-tight">{badge.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{badge.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}