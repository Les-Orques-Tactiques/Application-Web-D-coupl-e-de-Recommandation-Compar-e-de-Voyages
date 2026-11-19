import type { SaisieRecherche, Vol } from "./types";

/** Données envoyées par PageResultats à PageDetailVol (via l'état de navigation). */
export type EtatDetailVol = {
    vol: Vol;
    saisie: SaisieRecherche;
    budget: number;
    favori: boolean;
    depuisLaBase: boolean;
    nbResultats: number;
    retour: string; // adresse de la page Résultats, pour le lien « Revenir »
};

/** "CDG · Paris (Roissy)" → { code: "CDG", ville: "Paris (Roissy)" } */
export function decouperLieu(lieu: string) {
    const morceaux = lieu.split(" · ");
    const code = (morceaux[0] ?? lieu).trim();
    const ville = morceaux.slice(1).join(" · ").trim();
    return { code, ville: ville || code };
}

/** "Paris (Roissy-en-France, Val-d'Oise)" → "Paris" (pour le grand titre) */
export function villeCourte(lieu: string): string {
    return decouperLieu(lieu).ville.replace(/\s*\(.*\)$/, "");
}

/** 160 → "2 h 40" */
export function formaterDuree(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = String(minutes % 60).padStart(2, "0");
    return `${h} h ${m}`;
}

/** "2027-06-12" → "Samedi 12 juin 2027" */
export function formaterJour(iso: string): string {
    if (!iso) return "Date non renseignée";
    // Midi : évite qu'un décalage horaire fasse basculer au jour précédent
    const texte = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** "12 juin 2027 – 19 juin 2027 · Aller-retour · 1 adulte" */
export function formaterPeriode(saisie: SaisieRecherche): string {
    const court = (iso: string) =>
        new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const dates = saisie.allerRetour && saisie.retour ? `${court(saisie.aller)} – ${court(saisie.retour)}` : court(saisie.aller);
    const type = saisie.allerRetour ? "Aller-retour" : "Aller simple";
    const personnes = `${saisie.passagers} adulte${saisie.passagers > 1 ? "s" : ""}`;
    return `${dates} · ${type} · ${personnes}`;
}

/** Les raisons affichées dans « Pourquoi on vous recommande ce vol ». */
export function raisonsRecommandation(vol: Vol, budget: number) {
    const raisons: { titre: string; detail: string }[] = [];
    if (vol.prix <= budget) {
        raisons.push({
            titre: `${Math.round(budget - vol.prix)} € sous votre budget`,
            detail: `${vol.prix} € par personne, pour un maximum renseigné de ${budget} €.`,
        });
    }
    raisons.push(
        vol.escale
            ? { titre: "Un trajet avec escale", detail: `${vol.escale} · ${formaterDuree(vol.duree)} de trajet à l'aller.` }
            : { titre: "Du temps pour la destination", detail: `Vol direct de ${formaterDuree(vol.duree)} à l'aller.` },
    );
    if (vol.cabine) {
        raisons.push({ titre: "Votre bagage cabine est compris", detail: "Il est inclus dans le tarif affiché." });
    }
    return raisons;
}