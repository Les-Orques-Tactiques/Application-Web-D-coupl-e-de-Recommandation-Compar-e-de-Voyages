import { appelerApi } from "@/lib/clientApi";

/*
 * Avis (US17) et journal des interactions (US22).
 * Miroir de backend/app/controllers/InteractionController.py.
 */

export type TypeInteraction = "vue" | "reserver";

/** Avis actuel sur un vol : true, false, ou null si aucun avis. */
export async function lireAvis(volId: string): Promise<boolean | null> {
  const reponse = await appelerApi<{ pertinent: boolean | null }>(
    `/api/utilisateurs/moi/avis/${volId}`,
  );
  return reponse.pertinent;
}

/** Donne (ou change) son avis. `null` retire l'avis. */
export async function definirAvis(volId: string, pertinent: boolean | null): Promise<void> {
  if (pertinent === null) {
    await appelerApi<void>(`/api/utilisateurs/moi/avis/${volId}`, { methode: "DELETE" });
    return;
  }
  await appelerApi<void>(`/api/utilisateurs/moi/avis/${volId}`, {
    methode: "PUT",
    corps: { pertinent },
  });
}

/**
 * Journalise une vue ou un clic « Réserver ».
 * Le back ne garde la ligne que si l'utilisateur a accepté la personnalisation,
 * et une erreur ici ne doit jamais gêner l'utilisateur : on l'ignore.
 */
export async function journaliserInteraction(volId: string, type: TypeInteraction): Promise<void> {
  try {
    await appelerApi<void>("/api/utilisateurs/moi/interactions", {
      methode: "POST",
      corps: { vol_id: volId, type },
    });
  } catch {
    /* journal best-effort : pas de message d'erreur à l'écran */
  }
}
