import type { RechercheHistorique } from "@/features/explorer";
import { formaterDate } from "@/features/explorer/utils/formatage";

/** "2026-11-20T15:35:18+00:00" → "2026-11-20", à l'heure locale. Sert à regrouper par jour. */
export function cleDuJour(iso: string | null): string {
    if (!iso) return "inconnu";
    const d = new Date(iso);
    const mois = String(d.getMonth() + 1).padStart(2, "0");
    const jour = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Titre d'un groupe : « Aujourd'hui », « Hier » ou la date. */
export function libelleJour(cle: string): string {
    if (cle === "inconnu") return "Date inconnue";
    const maintenant = new Date();
    const hier = new Date();
    hier.setDate(maintenant.getDate() - 1);
    if (cle === cleDuJour(maintenant.toISOString())) return "Aujourd'hui";
    if (cle === cleDuJour(hier.toISOString())) return "Hier";
    return formaterDate(cle);
}

/** "2026-11-20T15:35:18+00:00" → "16:35" (heure locale). */
export function heureDeRecherche(iso: string): string {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Un groupe = un jour et les recherches faites ce jour-là. */
export type GroupeDeRecherches = { cle: string; recherches: RechercheHistorique[] };

/** Regroupe les recherches par jour, en gardant l'ordre (la plus récente d'abord). */
export function grouperParJour(liste: RechercheHistorique[]): GroupeDeRecherches[] {
    const groupes: GroupeDeRecherches[] = [];
    for (const r of liste) {
        const cle = cleDuJour(r.cree_le);
        const dernier = groupes[groupes.length - 1];
        if (dernier && dernier.cle === cle) dernier.recherches.push(r);
        else groupes.push({ cle, recherches: [r] });
    }
    return groupes;
}