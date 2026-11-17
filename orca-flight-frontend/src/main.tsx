import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { routeur } from "@/app/routeur";
import "./index.css";

/*
 * Point d'entrée de l'application : c'est le premier fichier exécuté par le navigateur.
 * Il "branche" React sur la <div id="root"> de index.html.
 *
 * - createRoot(...).render(...) : démarre React et affiche l'application dans cette div.
 * - StrictMode : outil de développement qui exécute certains codes deux fois pour repérer
 *   les bugs. Il n'a aucun effet en production.
 * - RouterProvider : affiche la bonne page selon l'adresse du navigateur (voir routeur.tsx).
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={routeur} />
  </StrictMode>,
);
