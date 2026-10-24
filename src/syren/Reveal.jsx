import React, { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return undefined;
    }

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setVisible(true);
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
    };
    const checkPosition = () => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) show();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        show();
      },
      { rootMargin: "0px 0px -8%", threshold: 0.01 },
    );
    observer.observe(element);
    window.addEventListener("scroll", checkPosition, { passive: true });
    checkPosition();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkPosition);
    };
  }, []);

  return (
    <Tag ref={ref} className={`reveal${visible ? " is-visible" : ""} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
