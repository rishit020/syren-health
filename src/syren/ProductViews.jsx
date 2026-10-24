import React, { useState } from "react";
import DeviceImage from "./DeviceImage.jsx";

export default function ProductViews() {
  const [view, setView] = useState("detail");
  return (
    <div className="product-views">
      <DeviceImage kind="detail" assetKey={view} />
      <div className="product-views__controls" role="group" aria-label="Device views">
        <button type="button" aria-pressed={view === "detail"} onClick={() => setView("detail")}>Front view</button>
        <button type="button" aria-pressed={view === "alternate"} onClick={() => setView("alternate")}>Side view</button>
      </div>
    </div>
  );
}
