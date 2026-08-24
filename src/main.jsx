import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ---------------------------------------------------------------
// Polyfill de window.storage (spécifique aux artifacts Claude.ai)
// Ici on le remplace par localStorage pour que le site fonctionne
// une fois déployé sur Vercel. ATTENTION : localStorage est propre
// à CHAQUE navigateur — un client qui commande depuis son téléphone
// ne sera PAS visible dans l'admin sur ton ordinateur. Pour un vrai
// suivi de commandes multi-appareils, il faudra remplacer ceci par
// une vraie base de données (ex. Supabase, Firebase).
// ---------------------------------------------------------------
if (!window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      return raw === null ? null : { value: raw };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      return { keys };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
