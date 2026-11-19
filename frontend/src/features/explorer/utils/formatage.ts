/** 135 → "2 h 15" ; 45 → "45 min" */
export function formaterDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return heures ? `${heures} h ${reste.toString().padStart(2, "0")}` : `${reste} min`;
}

/** "2027-06-12" → "12 juin 2027". Midi évite un décalage d'un jour à cause du fuseau horaire. */
export function formaterDate(date: string | null): string {
  if (!date) return "Date inconnue";
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** 189 + "EUR" → "189,00 €" */
export function formaterPrix(prix: number, devise: string): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: devise.trim() }).format(prix);
}

export function messageErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : "Une erreur inattendue est survenue.";
}

export function formaterHeure(iso: string | null): string | null {
  return iso && iso.length >= 16 ? iso.slice(11, 16) : null;
}