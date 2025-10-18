import React, { useEffect, useState } from "react";

export type HeroIllustrationProps = {
  className?: string;
  scene?: "create" | "analytics";
  speed?: number;
  colors?: {
    bgStart?: string;
    bgMid?: string;
    bgEnd?: string;
    accent?: string;
  };
};

const DEFAULT_COLORS = {
  bgStart: "#0ea5e9",
  bgMid: "#6366f1",
  bgEnd: "#ec4899",
  accent: "#22d3ee",
};

const FLOAT_DURATION = 3.5;
const PULSE_DURATION = 2.8;
const ORBIT_DURATION = 18;

const HeroIllustration: React.FC<HeroIllustrationProps> = ({
  className,
  scene = "create",
  speed = 1,
  colors = {},
}) => {
  const merged = { ...DEFAULT_COLORS, ...colors };
  const [prefersReduce, setPrefersReduce] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduce(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const floatDur = (FLOAT_DURATION * speed).toFixed(2) + "s";
  const pulseDur = (PULSE_DURATION * speed).toFixed(2) + "s";
  const orbitDur = (ORBIT_DURATION * speed).toFixed(2) + "s";
  const showAnalytics = scene === "analytics";

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label="Animated QR hero illustration"
        viewBox="0 0 960 560"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Animated QR hero illustration</title>
        <desc>An animated cube made from QR shapes with orbiting feature icons.</desc>

        <defs>
          <radialGradient id="heroGradient" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor={merged.bgStart} stopOpacity="0.95" />
            <stop offset="55%" stopColor={merged.bgMid} stopOpacity="0.8" />
            <stop offset="100%" stopColor={merged.bgEnd} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        <g id="bg">
          <rect width="960" height="560" fill="url(#heroGradient)" rx="48" />
        </g>

        <g id="glow" opacity="0.35">
          <ellipse cx="480" cy="430" rx="220" ry="70" fill={merged.accent} />
          {!prefersReduce && (
            <animate
              attributeName="opacity"
              values="0.25;0.5;0.25"
              dur={pulseDur}
              repeatCount="indefinite"
            />
          )}
        </g>

        <g id="cube">
          {!prefersReduce && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 -12; 0 6; 0 -12"
              dur={floatDur}
              repeatCount="indefinite"
            />
          )}
          <g id="cubeTop">
            <path
              d="M480 190 L580 230 L480 270 L380 230 Z"
              fill="#eef2ff"
              stroke="#c7d2fe"
              strokeWidth="3"
            />
            <circle cx="430" cy="230" r="10" fill="#4f46e5" opacity="0.3" />
            <circle cx="470" cy="215" r="8" fill="#1d4ed8" opacity="0.35" />
            <circle cx="520" cy="245" r="12" fill="#0ea5e9" opacity="0.28" />
          </g>
          <g id="cubeLeft">
            <path
              d="M380 230 L380 330 L480 370 L480 270 Z"
              fill="#1e1b4b"
              stroke="#312e81"
              strokeWidth="3"
            />
            <rect x="400" y="250" width="28" height="28" fill="#fde68a" opacity="0.9" />
            <rect x="436" y="250" width="14" height="28" fill="#2563eb" opacity="0.7" />
            <rect x="400" y="288" width="14" height="14" fill="#f9a8d4" opacity="0.7" />
            <rect x="420" y="288" width="22" height="14" fill="#34d399" opacity="0.8" />
            <rect x="450" y="288" width="18" height="14" fill="#a855f7" opacity="0.7" />
            <rect x="400" y="310" width="36" height="16" fill="#38bdf8" opacity="0.75" />
            <rect x="440" y="310" width="18" height="16" fill="#f97316" opacity="0.7" />
          </g>
          <g id="cubeRight">
            <path
              d="M580 230 L580 330 L480 370 L480 270 Z"
              fill="#3b82f6"
              stroke="#1d4ed8"
              strokeWidth="3"
            />
            <rect x="500" y="250" width="32" height="32" fill="#eef2ff" />
            <rect x="540" y="250" width="24" height="18" fill="#1e40af" opacity="0.6" />
            <rect x="500" y="288" width="18" height="22" fill="#0ea5e9" opacity="0.7" />
            <rect x="522" y="288" width="30" height="22" fill="#22d3ee" opacity="0.6" />
            <rect x="500" y="316" width="24" height="16" fill="#bae6fd" opacity="0.7" />
          </g>
        </g>

        <g id="icons" transform="rotate(0 480 260)">
          {!prefersReduce && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 480 260;360 480 260"
              dur={orbitDur}
              repeatCount="indefinite"
            />
          )}
          <g transform="translate(480 260)">
            <OrbitIcon angle={0} color="#0ea5e9">
              <path d="M14 18 L14 10 L21 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 14 H22 V22 H10 V18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </OrbitIcon>
            <OrbitIcon angle={90} color="#10b981" hidden={showAnalytics}>
              <rect x="11" y="8" width="14" height="14" rx="3" />
              <circle cx="18" cy="15" r="4" fill="#fff" />
            </OrbitIcon>
            <OrbitIcon angle={180} color="#f59e0b" hidden={showAnalytics}>
              <path d="M12 20 L12 12 L16 9 L20 12 V20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16 L20 16" strokeWidth="2" strokeLinecap="round" />
            </OrbitIcon>
            {showAnalytics ? (
              <OrbitIcon angle={180} color="#f97316">
                <rect x="12" y="16" width="3" height="6" rx="1.5" />
                <rect x="17" y="12" width="3" height="10" rx="1.5" />
                <rect x="22" y="14" width="3" height="8" rx="1.5" />
              </OrbitIcon>
            ) : null}
            <OrbitIcon angle={270} color="#6366f1">
              <path d="M12 15 C12 12 14 10 17 10 C20 10 22 12 22 15 C22 18 20 20 17 20" strokeWidth="2" strokeLinecap="round" />
              <circle cx="17" cy="22" r="2" />
            </OrbitIcon>
          </g>
        </g>
      </svg>
    </div>
  );
};

const OrbitIcon: React.FC<{
  angle: number;
  color: string;
  children: React.ReactNode;
  hidden?: boolean;
}> = ({ angle, color, children, hidden }) => {
  return (
    <g opacity={hidden ? 0 : 1} transform={`rotate(${angle}) translate(0 -160)`}>
      <circle cx="17" cy="17" r="17" fill={color} opacity="0.65" />
      <g transform="translate(6 6)" stroke="#fff" fill="none" strokeWidth="1.5">
        {children}
      </g>
    </g>
  );
};

export default HeroIllustration;

/* Usage example:
import HeroIllustration from './HeroIllustration';
...
<HeroIllustration className="w-full max-w-4xl" scene="analytics" />
*/
