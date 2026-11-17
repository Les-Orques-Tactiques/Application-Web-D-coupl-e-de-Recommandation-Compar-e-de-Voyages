import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { lireMonProfil, seConnecter, seDeconnecter } from "../api";
import type { Utilisateur } from "../types";
import { ContexteAuth } from "./useAuth";

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  // Au démarrage : le cookie httpOnly est invisible pour le JS, on demande donc au serveur
  useEffect(() => {
    let actif = true;
    lireMonProfil()
      .then((user) => { if (actif) setUtilisateur(user); })
      .catch(() => { if (actif) setUtilisateur(null); }) // 401 (ou serveur injoignable) = non connecté
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  // Si clientApi signale que la session a expiré pendant l'utilisation (voir section 6)
  useEffect(() => {
    const surExpiration = () => setUtilisateur(null);
    window.addEventListener("auth:session-expiree", surExpiration);
    return () => window.removeEventListener("auth:session-expiree", surExpiration);
  }, []);

  const connecter = useCallback(async (identifiants: Parameters<typeof seConnecter>[0]) => {
    const user = await seConnecter(identifiants);
    setUtilisateur(user);
    return user;
  }, []);

  const deconnecter = useCallback(async () => {
    try {
      await seDeconnecter();
    } catch {
      // Même si le serveur ne répond pas, on déconnecte l'interface
    } finally {
      setUtilisateur(null);
    }
  }, []);

  // useMemo évite de re-rendre tous les composants abonnés à chaque rendu du fournisseur
  const valeur = useMemo(
    () => ({ utilisateur, chargement, connecter, deconnecter, setUtilisateur }),
    [utilisateur, chargement, connecter, deconnecter],
  );

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}
