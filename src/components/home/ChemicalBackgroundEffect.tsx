import React, { useEffect, useState } from 'react';

/**
 * ChemicalBackgroundEffect Component
 * Renders an atmospheric chemical laboratory environment strictly on the RIGHT side:
 * - Animated chemical benzene rings with functional groups & electron clouds
 * - Hexagonal chemical lattice mesh with scroll parallax (masked away from left side)
 * - Effervescent rising solution bubbles along the right canvas
 * - Floating molecular annotations & laboratory fluid glow orbs on the right
 * 
 * The left side is kept completely clean for high-contrast reading of marketing copy and headlines.
 */
export const ChemicalBackgroundEffect: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="chemical-bg-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* 1. Ambient Laboratory Fluid Glow Orbs (Strictly Right-Aligned) */}
      <div
        style={{
          position: 'absolute',
          top: '-5%',
          right: '5%',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.08) 45%, transparent 70%)',
          filter: 'blur(50px)',
          transform: `translate3d(0, ${scrollY * 0.08}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          right: '8%',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 70%)',
          filter: 'blur(45px)',
          transform: `translate3d(0, ${-scrollY * 0.06}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '72%',
          right: '2%',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, rgba(37, 99, 235, 0.05) 50%, transparent 70%)',
          filter: 'blur(45px)',
          transform: `translate3d(0, ${scrollY * 0.05}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* 2. Chemical Hexagonal Lattice Mesh Pattern - Masked to appear ONLY on the right half */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.55,
          maskImage: 'linear-gradient(to right, transparent 0%, transparent 48%, rgba(0, 0, 0, 0.25) 65%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 48%, rgba(0, 0, 0, 0.25) 65%, black 100%)',
        }}
      >
        <defs>
          <pattern
            id="chem-hex-pattern-v2"
            width="60"
            height="103.92"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(0, ${-scrollY * 0.07})`}
          >
            <path
              d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z M30 103.92 L60 86.6 L60 51.96 L30 69.28 L0 51.96 L0 86.6 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.9"
              strokeDasharray="2,3"
            />
            {/* Center nodes for lattice depth */}
            <circle cx="30" cy="0" r="1.5" fill="#3b82f6" opacity="0.4" />
            <circle cx="60" cy="51.96" r="1.5" fill="#0284c7" opacity="0.4" />
            <circle cx="0" cy="51.96" r="1.5" fill="#0284c7" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chem-hex-pattern-v2)" />
      </svg>

      {/* 3. Hero Right Primary Molecular Benzene Ring (Prominent on Right Viewport) */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '360px',
          height: '360px',
          opacity: 0.85,
          transform: `translate3d(0, ${scrollY * 0.14}px, 0) rotate(${scrollY * 0.035}deg)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          {/* Benzene Ring */}
          <polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="rgba(239, 246, 255, 0.45)"
            stroke="#2563eb"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Pi electron circular orbit */}
          <circle
            cx="100"
            cy="100"
            r="44"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.2"
            strokeDasharray="6,4"
          />
          {/* Functional Group Bonds with Atom Nodes */}
          <line x1="100" y1="20" x2="100" y2="-2" stroke="#2563eb" strokeWidth="2.8" />
          <circle cx="100" cy="-2" r="5" fill="#1d4ed8" />
          <text x="110" y="6" fill="#1e40af" fontSize="11" fontWeight="800" fontFamily="sans-serif">—OH</text>

          <line x1="170" y1="140" x2="194" y2="154" stroke="#2563eb" strokeWidth="2.8" />
          <circle cx="194" cy="154" r="5" fill="#0284c7" />
          <text x="182" y="174" fill="#0369a1" fontSize="10" fontWeight="800" fontFamily="sans-serif">—SO₃Na</text>

          <line x1="30" y1="140" x2="8" y2="154" stroke="#2563eb" strokeWidth="2.8" />
          <circle cx="8" cy="154" r="5" fill="#2563eb" />
          <text x="-4" y="174" fill="#1d4ed8" fontSize="10" fontWeight="800" fontFamily="sans-serif">—NH₂</text>
        </svg>
      </div>

      {/* 4. Polymer Molecular Chain (Middle Right - Products / Formulations Zone) */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          right: '4%',
          width: '280px',
          height: '280px',
          opacity: 0.72,
          transform: `translate3d(0, ${-scrollY * 0.09}px, 0) rotate(${-scrollY * 0.03}deg)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <polygon
            points="100,25 165,62 165,138 100,175 35,138 35,62"
            fill="rgba(240, 249, 255, 0.4)"
            stroke="#0284c7"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Alternating double bonds */}
          <line x1="95" y1="36" x2="152" y2="69" stroke="#38bdf8" strokeWidth="2.4" />
          <line x1="155" y1="130" x2="100" y2="162" stroke="#38bdf8" strokeWidth="2.4" />
          <line x1="45" y1="130" x2="45" y2="70" stroke="#38bdf8" strokeWidth="2.4" />
          {/* Extended Polymer Branch */}
          <line x1="165" y1="62" x2="198" y2="44" stroke="#0284c7" strokeWidth="2.8" />
          <circle cx="198" cy="44" r="4.5" fill="#0369a1" />
          <text x="175" y="32" fill="#0284c7" fontSize="10" fontWeight="800" fontFamily="sans-serif">—[CH₂—CH]n</text>
        </svg>
      </div>

      {/* 5. Aromatic Ring Cluster (Bottom Right - Alliances & Partners Zone) */}
      <div
        style={{
          position: 'absolute',
          top: '76%',
          right: '5%',
          width: '280px',
          height: '280px',
          opacity: 0.65,
          transform: `translate3d(0, ${scrollY * 0.07}px, 0) rotate(${scrollY * 0.02}deg)`,
          willChange: 'transform',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          <polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="rgba(238, 242, 255, 0.4)"
            stroke="#6366f1"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="5,4" />
          <line x1="100" y1="20" x2="100" y2="0" stroke="#6366f1" strokeWidth="2.5" />
          <circle cx="100" cy="0" r="4.5" fill="#4f46e5" />
          <text x="110" y="8" fill="#4338ca" fontSize="10" fontWeight="700" fontFamily="sans-serif">—CH₃</text>
        </svg>
      </div>

      {/* 6. Effervescent Laboratory Solution Bubbles (Rising Particles - Strictly on the Right) */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '18%',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #bfdbfe, #2563eb)',
          boxShadow: '0 0 14px rgba(37, 99, 235, 0.35)',
          opacity: 0.55,
          transform: `translate3d(0, ${-scrollY * 0.24}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '36%',
          right: '28%',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #a5f3fc, #0284c7)',
          boxShadow: '0 0 10px rgba(2, 132, 199, 0.3)',
          opacity: 0.55,
          transform: `translate3d(0, ${-scrollY * 0.32}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          right: '12%',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #c7d2fe, #4f46e5)',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.28)',
          opacity: 0.48,
          transform: `translate3d(0, ${-scrollY * 0.19}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '74%',
          right: '22%',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #93c5fd, #1d4ed8)',
          boxShadow: '0 0 12px rgba(29, 78, 216, 0.3)',
          opacity: 0.48,
          transform: `translate3d(0, ${-scrollY * 0.26}px, 0)`,
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '88%',
          right: '9%',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #bfdbfe, #3b82f6)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
          opacity: 0.5,
          transform: `translate3d(0, ${-scrollY * 0.22}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* 7. Subtle Chemistry Annotations (Strictly on the Right Side) */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          right: '8%',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          opacity: 0.55,
          letterSpacing: '1px',
          transform: `translate3d(0, ${scrollY * 0.05}px, 0)`,
          willChange: 'transform',
        }}
      >
        [C₆H₄(OH)(SO₃Na)] • pH 6.8
      </div>
      <div
        style={{
          position: 'absolute',
          top: '52%',
          right: '10%',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          opacity: 0.5,
          letterSpacing: '1px',
          transform: `translate3d(0, ${-scrollY * 0.04}px, 0)`,
          willChange: 'transform',
        }}
      >
        VISCOSITY ~ 200 cP • 25°C
      </div>
      <div
        style={{
          position: 'absolute',
          top: '84%',
          right: '6%',
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          opacity: 0.45,
          letterSpacing: '1px',
          transform: `translate3d(0, ${scrollY * 0.03}px, 0)`,
          willChange: 'transform',
        }}
      >
        REACH COMPLIANT • ZERO HEAVY METALS
      </div>
    </div>
  );
};
