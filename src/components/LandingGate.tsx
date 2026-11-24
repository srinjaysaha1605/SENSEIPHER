import {useEffect, useRef, useState} from 'react';

interface LandingGateProps {
  onEnter: () => void;
}

export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 36 22"
        className="w-8 h-5 shrink-0"
        aria-hidden="true"
      >
        <polygon
          points="7,1 29,1 35,11 29,21 7,21 1,11"
          fill="none"
          stroke="#f4f4f5"
          strokeWidth="1.5"
        />
        <line x1="7" y1="11" x2="29" y2="11" stroke="#52525b" strokeWidth="1" />
        <polygon points="15,6 21,6 24,11 21,16 15,16 12,11" fill="#f4f4f5" />
        <rect x="17" y="9" width="2" height="4" fill="#050505" />
      </svg>
      <span className="font-display text-base sm:text-lg font-bold tracking-[0.14em] uppercase text-[#f4f4f5]">
        Sense<span className="text-[#a1a1aa]">ipher</span>
      </span>
    </span>
  );
}

export function LandingGate({onEnter}: LandingGateProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const irisGroupRef = useRef<SVGGElement | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncCapability = () => {
      const enabled = pointerQuery.matches && !motionQuery.matches;
      setTrackingEnabled(enabled);
      if (!enabled && irisGroupRef.current) {
        irisGroupRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    };

    syncCapability();
    pointerQuery.addEventListener('change', syncCapability);
    motionQuery.addEventListener('change', syncCapability);

    return () => {
      pointerQuery.removeEventListener('change', syncCapability);
      motionQuery.removeEventListener('change', syncCapability);
    };
  }, []);

  useEffect(() => {
    if (!trackingEnabled) {
      return;
    }

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      if (irisGroupRef.current) {
        irisGroupRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0px)`;
      }

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const scheduleTick = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }
      const button = buttonRef.current;
      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const maxDistance = Math.max(window.innerWidth, window.innerHeight) * 0.42 || 1;
      const distance = Math.hypot(dx, dy);
      const scale = Math.min(1, distance / maxDistance);
      const angle = Math.atan2(dy, dx);

      targetX = Math.cos(angle) * scale * 18;
      targetY = Math.sin(angle) * scale * 10;
      scheduleTick();
    };

    const handleWindowLeave = () => {
      targetX = 0;
      targetY = 0;
      scheduleTick();
    };

    window.addEventListener('pointermove', handlePointerMove, {passive: true});
    document.addEventListener('mouseleave', handleWindowLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleWindowLeave);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [trackingEnabled]);

  return (
    <div className="min-h-screen abstract-canvas text-[#f4f4f5] flex flex-col justify-between px-4 py-5 sm:px-6 lg:px-10 sm:py-8 overflow-x-hidden">
      <header className="w-full flex items-center justify-between gap-4 border-b border-[#27272a] pb-4">
        <BrandLogo />
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <div className="relative flex items-center justify-center">
          <button
            ref={buttonRef}
            type="button"
            onClick={onEnter}
            aria-label="Enter Senseipher workspace"
            className="group relative block cursor-pointer bg-transparent border-0 p-2 transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-[0.98]"
          >
            <svg
              viewBox="0 0 400 280"
              className="w-[270px] h-[189px] sm:w-[400px] sm:h-[280px] block"
              role="img"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="senseipher-eye-aperture">
                  <path d="M 52 140 Q 200 44 348 140 Q 200 236 52 140 Z" />
                </clipPath>
              </defs>

              {/* Abstract diagonal field vectors */}
              <line x1="20" y1="20" x2="92" y2="92" stroke="#27272a" strokeWidth="1" />
              <line x1="380" y1="20" x2="308" y2="92" stroke="#27272a" strokeWidth="1" />
              <line x1="20" y1="260" x2="92" y2="188" stroke="#27272a" strokeWidth="1" />
              <line x1="380" y1="260" x2="308" y2="188" stroke="#27272a" strokeWidth="1" />

              {/* Outer slow-rotating abstract rings */}
              <g className="orbit-cw">
                <circle
                  cx="200"
                  cy="140"
                  r="126"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="18 10 4 10"
                />
                <circle
                  cx="200"
                  cy="14"
                  r="2.5"
                  fill="#71717a"
                />
                <circle
                  cx="200"
                  cy="266"
                  r="2.5"
                  fill="#71717a"
                />
              </g>

              <g className="orbit-ccw">
                <circle
                  cx="200"
                  cy="140"
                  r="102"
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray="42 18 8 18"
                />
              </g>

              {/* Chamfered outer geometry framing the eye */}
              <polygon
                points="44,140 94,46 306,46 356,140 306,234 94,234"
                fill="#09090b"
                fillOpacity="0.72"
                stroke="#3f3f46"
                strokeWidth="1.25"
                className="transition-colors duration-200 group-hover:stroke-[#a1a1aa]"
              />

              {/* Horizontal & vertical anchor axes */}
              <line x1="12" y1="140" x2="44" y2="140" stroke="#71717a" strokeWidth="1.5" />
              <line x1="356" y1="140" x2="388" y2="140" stroke="#71717a" strokeWidth="1.5" />
              <line x1="200" y1="18" x2="200" y2="46" stroke="#52525b" strokeWidth="1" />
              <line x1="200" y1="234" x2="200" y2="262" stroke="#52525b" strokeWidth="1" />

              {/* Eye sclera */}
              <path
                d="M 52 140 Q 200 44 348 140 Q 200 236 52 140 Z"
                fill="#141417"
                stroke="#e4e4e7"
                strokeWidth="2.5"
                className="transition-colors duration-200 group-hover:stroke-white"
              />

              {/* Clipped moving iris & pupil */}
              <g clipPath="url(#senseipher-eye-aperture)">
                <path
                  d="M 52 140 Q 200 66 348 140 Q 200 214 52 140 Z"
                  fill="#1f1f24"
                />

                <g ref={irisGroupRef} style={{transform: 'translate3d(0px, 0px, 0px)'}}>
                  <circle
                    cx="200"
                    cy="140"
                    r="52"
                    fill="#09090b"
                    stroke="#f4f4f5"
                    strokeWidth="2.25"
                  />
                  <circle
                    cx="200"
                    cy="140"
                    r="41"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="1.5"
                    strokeDasharray="3 4"
                  />
                  <circle
                    cx="200"
                    cy="140"
                    r="30"
                    fill="#141417"
                    stroke="#a1a1aa"
                    strokeWidth="1.5"
                  />

                  {/* Reticle axes */}
                  <line x1="148" y1="140" x2="170" y2="140" stroke="#a1a1aa" strokeWidth="1.5" />
                  <line x1="230" y1="140" x2="252" y2="140" stroke="#a1a1aa" strokeWidth="1.5" />
                  <line x1="200" y1="88" x2="200" y2="110" stroke="#a1a1aa" strokeWidth="1.5" />
                  <line x1="200" y1="170" x2="200" y2="192" stroke="#a1a1aa" strokeWidth="1.5" />

                  {/* Stepped geometric pupil */}
                  <polygon
                    points="190,122 210,122 219,131 219,149 210,158 190,158 181,149 181,131"
                    fill="#000000"
                    stroke="#ffffff"
                    strokeWidth="1.75"
                  />
                  <rect x="195" y="135" width="10" height="10" fill="#050505" />

                  {/* Crisp specular reflections */}
                  <rect x="187" y="128" width="6" height="6" fill="#ffffff" />
                  <rect x="208" y="147" width="3" height="3" fill="#a1a1aa" />
                </g>
              </g>

              {/* Outer aperture rim */}
              <path
                d="M 52 140 Q 200 44 348 140 Q 200 236 52 140 Z"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </svg>
          </button>
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#f4f4f5]">
          Uncover hidden messages
        </h1>

        <p className="mt-3 max-w-[54ch] text-sm sm:text-base leading-relaxed text-[#a1a1aa]">
          Paste scrambled text to identify how it was mixed, spot repeating letter patterns, and
          read likely plain-text matches.
        </p>

        <p className="mt-5 text-xs tracking-wide text-[#d4d4d8]">
          Select the eye above to begin
        </p>
      </main>
    </div>
  );
}
