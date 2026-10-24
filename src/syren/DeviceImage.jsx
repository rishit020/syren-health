import React, { useEffect, useState } from "react";

export default function DeviceImage({ kind, assetKey = kind, priority = false }) {
  const [asset, setAsset] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let current = true;
    fetch("/syren/product-images.json")
      .then((response) => {
        if (!response.ok) throw new Error("Product image manifest unavailable");
        return response.json();
      })
      .then((manifest) => {
        if (!current) return;
        const nextAsset = manifest[assetKey] || null;
        setAsset(nextAsset);
        setState(nextAsset?.src ? "loading" : "pending");
      })
      .catch(() => {
        if (current) setState("pending");
      });
    return () => {
      current = false;
    };
  }, [assetKey]);

  const alt = asset?.alt || `Concept render of the Syren Health room monitoring device (${kind} view)`;

  return (
    <figure className={`device-image device-image--${kind} is-${state}`}>
      <div className="device-image__stage">
        {state !== "loaded" ? <div className="device-image__placeholder">
          <div className="device-image__placeholder-mark">S</div>
          <p>{state === "error" ? "Device render unavailable" : "Syren device render pending"}</p>
        </div> : null}
        {asset?.src ? (
          <img
            src={asset.src}
            srcSet={asset.srcSet || undefined}
            sizes={kind === "hero" ? "(max-width: 809px) calc(100vw - 32px), 520px" : "(max-width: 809px) calc(100vw - 32px), 790px"}
            alt={alt}
            width={asset.width || undefined}
            height={asset.height || undefined}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
          />
        ) : null}
      </div>
      <figcaption>Concept / prototype render</figcaption>
    </figure>
  );
}
