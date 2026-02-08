const rootEl = document.getElementById("lifi-widget-root");
const errorEl = document.getElementById("lifi-widget-error");

if (rootEl) {
  (async () => {
    try {
      window.global = window.global || window;
      window.process = window.process || { env: { NODE_ENV: "production" } };

      const React = await import("https://esm.sh/react@18.2.0");
      const ReactDom = await import("https://esm.sh/react-dom@18.2.0/client");
      const { LiFiWidget } = await import("https://esm.sh/@lifi/widget@3.19.2?bundle");

      const widgetConfig = {
        theme: {
          palette: {
            mode: "dark",
          },
        },
        variant: "wide",
      };

      const root = ReactDom.createRoot(rootEl);
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
  })();
}
