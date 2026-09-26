'use client';

import React, { Suspense, useEffect, useState } from 'react';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

export function AnimatedBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ backgroundColor: 'hsl(0 0% 8%)', zIndex: 0 }}
      aria-hidden="true"
    >
      {/* 3D Spline Scene Layer */}
      <div className="absolute inset-0 w-full h-full">
        {isMounted ? (
          <Suspense fallback={<div className="absolute inset-0 bg-[#141414]" />}>
            <Spline
              scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
              className="w-full h-full"
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 bg-[#141414]" />
        )}
      </div>

      {/* Subtle cinematic tint overlay */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* Cinematic subtle radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}

export default AnimatedBackground;
