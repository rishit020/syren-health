import React, { useEffect, useRef } from "react";

export default function HeroArtwork() {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) {
        video.pause();
        if (video.readyState >= 1) video.currentTime = 1;
      } else {
        video.play().catch(() => {});
      }
    };
    video.addEventListener("loadedmetadata", update);
    preference.addEventListener("change", update);
    update();
    return () => {
      video.removeEventListener("loadedmetadata", update);
      preference.removeEventListener("change", update);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="hero__artwork hero-visual-enter"
      src="/assets/7fb2ddfe0ad9a1.webm"
      poster="/syren/hero-artwork-poster.webp"
      autoPlay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
