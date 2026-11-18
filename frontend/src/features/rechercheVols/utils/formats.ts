import type { SaisieRecherche } from "./types";

/** 150 → "2 h 30" */
export function dureeLisible(minutes: number): string {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** pluriel(2, "adulte") → "2 adultes" */
export function pluriel(nombre: number, mot: string): string {
  return `${nombre} ${mot}${nombre > 1 ? "s" : ""}`;
}

/** "12 juin – 19 juin 2027", ou seulement la date d'aller en aller simple. */
export function formaterDates(saisie: SaisieRecherche): string {
  const options = { day: "numeric", month: "short" } as const;
  // T12:00 : évite qu'un décalage horaire fasse changer de jour
  const aller = new Date(`${saisie.aller}T12:00:00`).toLocaleDateString("fr-FR", options);
  if (!saisie.allerRetour) return aller;
  const retour = new Date(`${saisie.retour}T12:00:00`).toLocaleDateString("fr-FR", { ...options, year: "numeric" });
  return `${aller} – ${retour}`;
}