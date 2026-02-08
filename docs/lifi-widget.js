import React from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { LiFiWidget } from "https://esm.sh/@lifi/widget@3.19.2";

const rootEl = document.getElementById("lifi-widget-root");
const errorEl = document.getElementById("lifi-widget-error");

if (rootEl) {
  try {
    const widgetConfig = {
      theme: {
        palette: {
          mode: "dark",
        },
      },
      variant: "wide",
    };

    const root = createRoot(rootEl);
    root.render(
      React.createElement(LiFiWidget, {
        integrator: "KnurFi",
        config: widgetConfig,
      })
    );
  } catch (err) {
    if (errorEl) {
      errorEl.style.display = "block";
    }
    console.error("Failed to load LI.FI widget", err);
  }
}
