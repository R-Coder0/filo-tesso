// TrustStrip.jsx
import { BadgeCheck, HandCoins, RefreshCcw, Truck } from "lucide-react";

const badges = [
  {
    label: "Cash on Delivery",
    sub: "Pay when you receive",
    Icon: HandCoins,
  },
  {
    label: "Fast Delivery",
    sub: "Quick & reliable shipping",
    Icon: Truck,
  },
  {
    label: "7-Day Returns",
    sub: "Hassle-free return policy",
    Icon: RefreshCcw,
  },
  {
    label: "100% Genuine",
    sub: "Authentic products only",
    Icon: BadgeCheck,
  },
];

export default function TrustStrip() {
  return (
    <section className="max-w-[1700px] mx-auto bg-white py-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-gray-200">
        {badges.map(({ label, sub, Icon }) => (
          <div
            key={label}
            className="group flex items-center gap-4 border-r border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-gray-950 transition-colors duration-200 group-hover:border-gray-950 group-hover:bg-gray-950 group-hover:text-white sm:h-14 sm:w-14">
              <Icon size={28} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                {label}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-snug">
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
