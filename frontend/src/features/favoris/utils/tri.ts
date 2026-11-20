import type { Vol } from "@/features/explorer";

/** Les deux ordres de tri proposés dans le menu déroulant. */
export type OrdrePrix = "croissant" | "decroissant";

/** " usd " → "USD" : on compare les devises sans tenir compte des espaces ni de la casse. */
export function normaliserDevise(devise: string): string {
    return devise.trim().toUpperCase();
}

/**
 * Vérifie qu'une valeur venant du <select> est bien un OrdrePrix.
 * C'est une « garde de type » : après le if, TypeScript sait que valeur est un OrdrePrix.
 */
export function estOrdrePrix(valeur: string): valeur is OrdrePrix {
    return valeur === "croissant" || valeur === "decroissant";
}

/**
 * Trie les favoris par devise, puis par prix dans chaque devise.
 * On regroupe d'abord par devise, car comparer 100 USD et 100 EUR n'aurait pas de sens.
 * On copie le tableau ([...favoris]) parce que sort() modifie le tableau d'origine.
 */
export function trierFavoris(favoris: Vol[], ordre: OrdrePrix): Vol[] {
    return [...favoris].sort((a, b) => {
        const ordreDevise = normaliserDevise(a.devise).localeCompare(normaliserDevise(b.devise));
        if (ordreDevise !== 0) return ordreDevise;
        return ordre === "croissant" ? a.prix - b.prix : b.prix - a.prix;
    });
}

/** true si les favoris utilisent au moins deux devises différentes. */
export function aPlusieursDevises(favoris: Vol[]): boolean {
    return new Set(favoris.map((vol) => normaliserDevise(vol.devise))).size > 1;
}