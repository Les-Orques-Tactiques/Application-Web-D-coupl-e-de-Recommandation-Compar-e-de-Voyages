export type Trajet = "direct" | "une_escale" | "indifferent";

export interface Preferences {
  aeroport: string; // code IATA, par exemple "LYS"
  budget: number | null; // null : sans limite
  trajet: Trajet;
}