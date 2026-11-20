import type { Filtres, SaisieRecherche, Tri } from "./types";

export const SAISIE_PAR_DEFAUT: SaisieRecherche = {
  origine: "Lyon LYS",
  destination: "Lisbonne LIS",
  aller: "2027-06-12",
  retour: "2027-06-19",
  allerRetour: true,
  passagers: 1,
};

export const FILTRES_PAR_DEFAUT: Filtres = {
  budget: 220,
  dureeMax: 6,
  directs: true,
  escales: true,
  compagniesExclues: [],
};

// "satisfies" : TypeScript vérifie qu'il y a un libellé pour CHAQUE tri
export const LIBELLES_TRI = {
  pertinence: "Pertinence",
  prix: "Prix croissant",
  duree: "Durée la plus courte",
  depart: "Départ le plus tôt",
} satisfies Record<Tri, string>;

export const DUREES_MAX = [3, 4, 5, 6];
export const NOMBRES_PASSAGERS = Array.from({ length: 9 }, (_, i) => i + 1);
