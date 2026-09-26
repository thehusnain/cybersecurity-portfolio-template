'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Trophy, ShieldCheck } from 'lucide-react';
import { asset, type Evidence, type Ctf } from './data';

interface Props {
  page: 'certificates' | 'ctfs';
  items: (Evidence | Ctf)[];
  onEvidence: (item: Evidence) => void;
}

const TOTAL_SLOTS = 20;
const AUTO_ROTATE_SPEED = 1.8; // degrees per second

export function Cinematic3DArchive({ page, items, onEvidence }: Props) {
  const isCtf = page === 'ctfs';
  const totalItems = items.length;
  const angleStep = 360 / TOTAL_SLOTS;

  // Active item state for minimal floating typography
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Responsive dimensions for landscape cards
  const [dimensions, setDimensions] = useState({
    radius: 1250,
    cardWidth: 340,
    cardHeight: 235,
    cullAngle: 50,
    perspective: 1150,
  });

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const phaseRef = useRef(0);
  const targetPhaseRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartPhaseRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Resize handler for responsive 3D ring geometry
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setDimensions({
          radius: 700,
          cardWidth: 215,
          cardHeight: 155,
          cullAngle: 42,
          perspective: 750,
        });
      } else if (w < 1024) {
        setDimensions({
          radius: 960,
          cardWidth: 280,
          cardHeight: 195,
          cullAngle: 46,
          perspective: 920,
        });
      } else {
        setDimensions({
          radius: 1250,
          cardWidth: 340,
          cardHeight: 235,
          cullAngle: 50,
          perspective: 1150,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update card transforms every animation frame
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { radius, cullAngle } = dimensions;
    const angleStepRad = Math.PI / 180;

    let lastActiveSlot = -1;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // Handle target snapping transition
      if (targetPhaseRef.current !== null) {
        const diff = targetPhaseRef.current - phaseRef.current;
        if (Math.abs(diff) < 0.05) {
          phaseRef.current = targetPhaseRef.current;
          targetPhaseRef.current = null;
          velocityRef.current = 0;
        } else {
          phaseRef.current += diff * Math.min(dt * 8, 1);
        }
      } else if (isDraggingRef.current) {
        // Dragging is actively controlling phaseRef
      } else {
        // Inertia decay or constant auto-rotation
        if (Math.abs(velocityRef.current) > 0.05) {
          phaseRef.current += velocityRef.current;
          velocityRef.current *= Math.pow(0.88, dt * 60);
        } else {
          velocityRef.current = 0;
          if (!prefersReducedMotion && !isHoveredRef.current) {
            phaseRef.current -= AUTO_ROTATE_SPEED * dt;
          }
        }
      }

      // Keep phase normalized
      phaseRef.current = ((phaseRef.current % 360) + 360) % 360;

      // Find closest centered slot
      let minAngleDist = Infinity;
      let closestSlot = 0;

      for (let i = 0; i < TOTAL_SLOTS; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        // Normalized angle in range [-180, 180]
        const rawAngle = i * angleStep + phaseRef.current;
        const normAngle = ((rawAngle % 360) + 540) % 360 - 180;
        const absAngle = Math.abs(normAngle);

        if (absAngle < minAngleDist) {
          minAngleDist = absAngle;
          closestSlot = i;
        }

        // Culling: hide cards outside visible cylindrical arc
        if (absAngle > cullAngle) {
          el.style.visibility = 'hidden';
          continue;
        }

        el.style.visibility = 'visible';

        // True 3D coordinates on cylinder curving away from camera
        const aRad = normAngle * angleStepRad;
        const x = radius * Math.sin(aRad);
        const z = -radius * (1 - Math.cos(aRad));
        const rotateY = -normAngle;

        // Realistic perspective lighting: nearest center is brightest (1.0), edges taper smoothly
        const brightness = Math.max(0.68, 1 - absAngle / 120);
        const opacity = Math.max(0.5, 1 - Math.pow(absAngle / cullAngle, 2) * 0.5);
        const isCenter = absAngle < angleStep / 2;

        el.style.transform = `translate3d(${x.toFixed(1)}px, 0px, ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg)`;
        el.style.filter = `brightness(${brightness.toFixed(2)})`;
        el.style.opacity = opacity.toFixed(2);
        el.style.zIndex = Math.round(1000 + z).toString();

        if (isCenter) {
          el.classList.add('is-center');
        } else {
          el.classList.remove('is-center');
        }
      }

      // Update minimal active state when closest slot changes
      if (closestSlot !== lastActiveSlot) {
        lastActiveSlot = closestSlot;
        const mappedItemIndex = closestSlot % totalItems;
        setActiveItemIndex(mappedItemIndex);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [dimensions, angleStep, totalItems]);

  // Pointer drag interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    targetPhaseRef.current = null;
    velocityRef.current = 0;
    dragStartXRef.current = e.clientX;
    lastPointerXRef.current = e.clientX;
    dragStartPhaseRef.current = phaseRef.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const currentX = e.clientX;
    const deltaX = currentX - dragStartXRef.current;
    const stepDelta = currentX - lastPointerXRef.current;
    lastPointerXRef.current = currentX;

    // Convert pixel delta to angular rotation
    const circumference = 2 * Math.PI * dimensions.radius;
    const angleDelta = (deltaX / circumference) * 360 * 1.15;
    phaseRef.current = dragStartPhaseRef.current + angleDelta;
    velocityRef.current = (stepDelta / circumference) * 360 * 1.15;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Rotate to specific slot
  const snapToSlot = useCallback(
    (slotIndex: number) => {
      const target = -slotIndex * angleStep;
      const current = phaseRef.current;
      const diff = ((target - current) % 360 + 540) % 360 - 180;
      targetPhaseRef.current = current + diff;
    },
    [angleStep]
  );

  const snapToItem = useCallback(
    (itemIndex: number) => {
      let bestSlot = 0;
      let minDiff = Infinity;
      for (let s = 0; s < TOTAL_SLOTS; s++) {
        if (s % totalItems === itemIndex) {
          const rawAngle = s * angleStep + phaseRef.current;
          const normAngle = Math.abs(((rawAngle % 360) + 540) % 360 - 180);
          if (normAngle < minDiff) {
            minDiff = normAngle;
            bestSlot = s;
          }
        }
      }
      snapToSlot(bestSlot);
    },
    [totalItems, angleStep, snapToSlot]
  );

  const stepNext = useCallback(() => {
    const currentPhase = targetPhaseRef.current ?? phaseRef.current;
    targetPhaseRef.current = currentPhase - angleStep;
  }, [angleStep]);

  const stepPrev = useCallback(() => {
    const currentPhase = targetPhaseRef.current ?? phaseRef.current;
    targetPhaseRef.current = currentPhase + angleStep;
  }, [angleStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stepPrev();
      if (e.key === 'ArrowRight') stepNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepPrev, stepNext]);

  const activeItem = items[activeItemIndex];

  return (
    <main className={`cylindrical-archive-page archive-${page}`}>
      {/* Top Breadcrumb Bar */}
      <div className="archive-top-bar">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="archive-badge">
          {isCtf ? <Trophy size={14} /> : <ShieldCheck size={14} />}
          <span>{isCtf ? 'COMPETITIVE OPERATIONS' : 'VERIFIED ACCREDITATIONS'}</span>
        </div>
      </div>

      {/* Cinematic Minimal Page Hero */}
      <header className="cylindrical-hero-head">
        <span className="eyebrow">
          {isCtf ? 'CAPTURE THE FLAG ARCHIVE' : 'CREDENTIAL & WORKSHOP VAULT'}
        </span>
        <h1>{isCtf ? 'Every flag has a story.' : 'The learning archive.'}</h1>
        <p>
          {isCtf
            ? 'Scoreboard records, ranked operations, and team forensics with Fsociety.'
            : 'Courses, workshops, and verified credentials earned across offensive security.'}
        </p>
      </header>

      {/* 3D Perspective Cylindrical Ring Stage */}
      <div
        className="ring-viewport-container"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        <div
          className="ring-stage"
          style={{ perspective: `${dimensions.perspective}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="ring-track">
            {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => {
              const item = items[slotIdx % totalItems];

              return (
                <div
                  key={slotIdx}
                  ref={(el) => {
                    cardRefs.current[slotIdx] = el;
                  }}
                  className="landscape-ring-card"
                  style={{
                    width: `${dimensions.cardWidth}px`,
                    height: `${dimensions.cardHeight}px`,
                    top: `-${dimensions.cardHeight / 2}px`,
                    left: `-${dimensions.cardWidth / 2}px`,
                  }}
                  onClick={() => {
                    // If card is already near center, open full evidence modal
                    const rawAngle = slotIdx * angleStep + phaseRef.current;
                    const normAngle = Math.abs(((rawAngle % 360) + 540) % 360 - 180);
                    if (normAngle < angleStep / 2) {
                      onEvidence(item);
                    } else {
                      snapToSlot(slotIdx);
                    }
                  }}
                >
                  <div className="landscape-card-inner">
                    <div className="card-thumb-frame">
                      <img
                        src={asset(item.image)}
                        alt={item.title}
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="card-sheen" />
                      <div className="card-slot-idx">
                        <span>{String((slotIdx % totalItems) + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="card-expand-hint">
                        <ArrowUpRight size={13} />
                      </div>
                    </div>

                    <div className="card-caption-block">
                      <div className="card-text-col">
                        <span className="card-tag">
                          {'team' in item ? (item as Ctf).team : item.meta.split('·')[0].trim()}
                        </span>
                        <h3 className="card-heading">{item.title}</h3>
                      </div>
                      {'result' in item ? (
                        <span className="card-rank-badge">{(item as Ctf).result}</span>
                      ) : (
                        <span className="card-verified-tag">VERIFIED</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle Carousel Ring Controls */}
        <div className="ring-nav-bar">
          <button
            className="ring-arrow-btn"
            onClick={stepPrev}
            aria-label="Rotate left"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="ring-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`ring-dot ${i === activeItemIndex ? 'active' : ''}`}
                onClick={() => snapToItem(i)}
                aria-label={`Jump to item ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="ring-arrow-btn"
            onClick={stepNext}
            aria-label="Rotate right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Floating Minimal Active Information (No large boxed UI panels) */}
      {activeItem && (
        <section className="active-floating-info" aria-live="polite">
          <div className="floating-badge-row">
            <span className="floating-issuer">
              {'team' in activeItem ? `TEAM ${(activeItem as Ctf).team}` : activeItem.meta}
            </span>
            {'result' in activeItem && (
              <span className="floating-result-pill">{(activeItem as Ctf).result}</span>
            )}
          </div>

          <h2 className="floating-title">{activeItem.title}</h2>

          {activeItem.description && (
            <p className="floating-desc">{activeItem.description}</p>
          )}

          <div className="floating-actions">
            <button
              className="floating-inspect-btn"
              onClick={() => onEvidence(activeItem)}
            >
              <span>{isCtf ? 'Inspect Scoreboard Record' : 'Inspect High-Res Certificate'}</span>
              <ArrowUpRight size={15} />
            </button>

            {'gallery' in activeItem && (activeItem as Ctf).gallery && (
              <div className="floating-subrecords">
                {(activeItem as Ctf).gallery!.map((g, gi) => (
                  <button
                    key={g}
                    className="floating-sub-btn"
                    onClick={() =>
                      onEvidence({
                        title: `${activeItem.title} — Supporting Record ${gi + 1}`,
                        image: g,
                        meta: (activeItem as Ctf).team,
                      })
                    }
                  >
                    <span>Record {gi + 1}</span>
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default Cinematic3DArchive;
