import { cn } from "@/lib/utils";

// CSS-animated time-slot grid — Zenith's signature background element.
// Represents bookable slots: the core artifact of the product.
export function SlotGrid() {
  const cols = 7;
  const rows = 5;
  const total = cols * rows;

  const activeSlots = new Set([2, 9, 16, 22, 28]);
  const checkingSlots = new Set([5, 13, 25]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: total }, (_, i) => {
            const isActive = activeSlots.has(i);
            const isChecking = checkingSlots.has(i);
            return (
              <div
                key={i}
                className={cn(
                  "h-7 w-12 rounded-md border",
                  isActive && "slot-active border-primary bg-primary",
                  isChecking && "slot-check border-primary/40 bg-primary/10",
                  !isActive && !isChecking && "border-primary/20 bg-transparent"
                )}
                style={
                  isActive
                    ? { animationDelay: `${(i * 0.4) % 2.4}s` }
                    : isChecking
                      ? { animationDelay: `${(i * 0.3) % 1.8}s` }
                      : undefined
                }
              />
            );
          })}
        </div>
      </div>

      <style>{`
        .slot-active {
          animation: slot-pulse 3s ease-in-out infinite;
        }
        .slot-check {
          animation: slot-check 2.8s ease-in-out infinite;
        }
        @keyframes slot-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; box-shadow: 0 0 8px var(--color-primary); }
        }
        @keyframes slot-check {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .slot-active, .slot-check { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
