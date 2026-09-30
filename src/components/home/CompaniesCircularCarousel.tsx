import React, { useRef, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import type { Collaboration } from '../../types';

interface CompaniesCircularCarouselProps {
  collaborations: Collaboration[];
}

/**
 * CompaniesCircularCarousel
 * - Continuous circular motion in a single line
 * - Dramatic 3D circular depth: Center company is BIG (1.42x), side companies are SMALL (0.64x)
 * - Minimal, borderless: ONLY the company logo on top, and ONLY the company name below
 * - Pauses rotation smoothly on hover
 * - Clicking any company navigates directly to the official website
 */
export const CompaniesCircularCarousel: React.FC<CompaniesCircularCarouselProps> = ({
  collaborations,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const singleSetRef = useRef<HTMLDivElement>(null);

  // Motion physics
  const posRef = useRef<number>(0);
  const velocityRef = useRef<number>(1.2); // Smooth continuous circular cruise speed
  const singleSetWidthRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  const activeItems = collaborations.filter((c) => c.active !== false);

  // Measure single set width for seamless circular wrap-around
  const measureSetWidth = useCallback(() => {
    if (singleSetRef.current) {
      const width = singleSetRef.current.offsetWidth;
      if (width > 0) {
        singleSetWidthRef.current = width;
      }
    }
  }, []);

  useEffect(() => {
    measureSetWidth();
    window.addEventListener('resize', measureSetWidth);
    return () => window.removeEventListener('resize', measureSetWidth);
  }, [measureSetWidth, activeItems.length]);

  // Main 60fps/120fps continuous circular motion loop with dramatic middle scaling
  useEffect(() => {
    if (activeItems.length === 0) return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      // 1. Horizontal circular translation (pauses when mouse is over company)
      if (!isPausedRef.current && !isDraggingRef.current) {
        posRef.current += velocityRef.current;

        const setWidth = singleSetWidthRef.current;
        if (setWidth > 0) {
          if (posRef.current >= setWidth) {
            posRef.current -= setWidth;
          } else if (posRef.current < 0) {
            posRef.current += setWidth;
          }
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-posRef.current}px, 0, 0)`;
        }
      }

      // 2. Real-time circular wheel scaling:
      // Middle item is BIG (1.42x), side items are SMALL (0.64x)
      if (containerRef.current && trackRef.current) {
        const viewportRect = containerRef.current.getBoundingClientRect();
        const centerX = viewportRect.left + viewportRect.width / 2;
        const maxDist = viewportRect.width * 0.46;

        const items = trackRef.current.querySelectorAll<HTMLElement>('.company-wheel-item');
        items.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const itemCenterX = rect.left + rect.width / 2;
          const dist = Math.abs(itemCenterX - centerX);

          const inner = item.querySelector<HTMLElement>('.company-wheel-inner');
          if (!inner) return;

          if (dist < maxDist) {
            // Spherical cosine curve for circular 3D depth
            const ratio = dist / maxDist;
            const curve = Math.cos(ratio * (Math.PI / 2));
            // Middle is big (1.42x), sides are small (0.64x)
            const scale = 0.64 + curve * 0.78;
            const opacity = 0.32 + curve * 0.68; // Middle is 1.0, sides are 0.32
            const translateY = -curve * 22; // Arches upward toward user

            inner.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
            inner.style.opacity = `${opacity.toFixed(3)}`;
          } else {
            inner.style.transform = `scale(0.60) translateY(0px)`;
            inner.style.opacity = `0.25`;
          }
        });
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeItems.length]);

  // Drag / Swipe handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartPosRef.current = posRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    posRef.current = dragStartPosRef.current - delta;

    const setWidth = singleSetWidthRef.current;
    if (setWidth > 0) {
      if (posRef.current >= setWidth) {
        posRef.current -= setWidth;
      } else if (posRef.current < 0) {
        posRef.current += setWidth;
      }
    }

    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-posRef.current}px, 0, 0)`;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (activeItems.length === 0) return null;

  // Render individual company item: ONLY Logo on top, ONLY Name below
  const renderItem = (collab: Collaboration, keyIndex: number) => {
    const itemKey = `wheel-collab-${collab.id}-${keyIndex}`;
    const hasLink = Boolean(collab.websiteUrl && collab.websiteUrl.trim().length > 0);

    const content = (
      <div className="company-wheel-inner">
        {/* Top: Company Logo Only */}
        <div className="company-wheel-logo-box">
          {collab.logoUrl ? (
            <img
              src={collab.logoUrl}
              alt={`${collab.name} logo`}
              className="company-wheel-logo-img"
              loading="lazy"
            />
          ) : (
            <Building2 size={36} color="#2563eb" />
          )}
        </div>

        {/* Below: Company Name Only */}
        <div className="company-wheel-name-label">
          {collab.name}
        </div>
      </div>
    );

    if (hasLink) {
      return (
        <a
          key={itemKey}
          href={collab.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="company-wheel-item company-wheel-link"
          onMouseEnter={() => {
            isPausedRef.current = true; // Pause on hover
          }}
          onMouseLeave={() => {
            isPausedRef.current = false; // Resume on leave
          }}
          onClick={(e) => {
            if (Math.abs(posRef.current - dragStartPosRef.current) > 8) {
              e.preventDefault();
            }
          }}
          title={`Visit ${collab.name} official website`}
          aria-label={`Visit ${collab.name} official website`}
        >
          {content}
        </a>
      );
    }

    return (
      <div
        key={itemKey}
        className="company-wheel-item"
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
        role="button"
        tabIndex={0}
        title={collab.name}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="company-circular-wheel-section">
      <div
        ref={containerRef}
        className="company-circular-wheel-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={trackRef} className="company-circular-wheel-track">
          {/* Set 1: Measured Set */}
          <div ref={singleSetRef} className="company-circular-wheel-set">
            {activeItems.map((collab, i) => renderItem(collab, i))}
          </div>

          {/* Set 2: Duplicate for seamless circular wrap-around */}
          <div className="company-circular-wheel-set" aria-hidden="true">
            {activeItems.map((collab, i) => renderItem(collab, i + activeItems.length))}
          </div>

          {/* Set 3: Duplicate for seamless circular wrap-around */}
          <div className="company-circular-wheel-set" aria-hidden="true">
            {activeItems.map((collab, i) => renderItem(collab, i + activeItems.length * 2))}
          </div>

          {/* Set 4: Duplicate for wide screens */}
          <div className="company-circular-wheel-set" aria-hidden="true">
            {activeItems.map((collab, i) => renderItem(collab, i + activeItems.length * 3))}
          </div>
        </div>
      </div>
    </div>
  );
};
