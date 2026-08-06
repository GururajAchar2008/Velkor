import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    let hasRefreshedForUpdate = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hasRefreshedForUpdate) return;
      hasRefreshedForUpdate = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        const activateWaitingWorker = () => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        };

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              activateWaitingWorker();
            }
          });
        });

        window.setInterval(() => {
          registration.update().catch(() => {});
        }, 60_000);

        activateWaitingWorker();
        console.log("SW registered");
      })
      .catch((err) => console.warn("SW failed:", err));
  });
}
