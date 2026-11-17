import { useEffect, useRef, useState } from "react";
import { ErreurApi } from "@/lib/clientApi";
import { activerCompte } from "../api";
import type { StatutActivation } from "../types";

/**
 * "Hook" personnalisé (une fonction dont le nom commence par "use") : il regroupe la logique
 * de la page d'activation pour que le composant n'ait plus qu'à afficher le résultat.
 *
 * - Sans jeton dans l'adresse : on est simplement "en_attente" (écran "Vérifiez votre boîte mail").
 * - Avec un jeton : on demande au serveur d'activer le compte, puis on renvoie le résultat.
 *
 * @param jeton Le jeton lu dans l'URL (/activation?jeton=...), ou null s'il est absent
 * @returns     Le statut actuel : le composant se met à jour tout seul quand il change
 */
export function useActivation(jeton: string | null): StatutActivation {
  // useState crée une donnée "réactive" : quand on appelle setStatut, React réaffiche le composant.
  // Valeur de départ : "chargement" si un jeton existe, sinon "en_attente".
  const [statut, setStatut] = useState<StatutActivation>(jeton ? "chargement" : "en_attente");

  // useRef garde une valeur entre deux affichages SANS provoquer de nouvel affichage.
  // On s'en sert pour ne contacter le serveur qu'une seule fois : le jeton est à usage unique,
  // et le mode StrictMode de React exécute l'effet deux fois en développement.
  const dejaAppele = useRef(false);

  // useEffect exécute du code APRÈS l'affichage (ici : un appel réseau).
  // Il se relance seulement si une valeur de la liste [jeton] change.
  useEffect(() => {
    if (!jeton || dejaAppele.current) return; // pas de jeton, ou déjà fait : on ne fait rien
    dejaAppele.current = true;

    activerCompte(jeton)
      .then(() => setStatut("succes")) // si l'appel réussit
      .catch((erreur: unknown) =>
        // si l'appel échoue : statut 410 = lien expiré, tout autre échec = lien invalide
        setStatut(erreur instanceof ErreurApi && erreur.statut === 410 ? "expire" : "invalide"),
      );
  }, [jeton]);

  return statut;
}
