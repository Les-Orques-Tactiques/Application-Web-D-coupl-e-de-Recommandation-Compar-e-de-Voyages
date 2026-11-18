/** Un vol tel qu'affiché sur la page (démo, ou converti depuis l'API). */
export type Vol = {
  id: string;
  compagnie: string;
  code: string;          // 2 lettres affichées dans la pastille
  depart: string; // "09:40"
  arrivee: string;
  duree: number;         // en minutes
  prix: number;
  escale: string | null; // null = vol direct
  cabine: boolean;       // bagage cabine inclus ?
  message: string;       // explication de la recommandation
  lieuDepart: string;    // "LYS · Lyon"
  lieuArrivee: string;
};

/** Ce que la personne tape dans le résumé et le formulaire de modification. */
export type SaisieRecherche = {
  origine: string;       // saisie libre, ex. "Lyon LYS"
  destination: string;
  aller: string;         // "2027-06-12"
  retour: string;
  allerRetour: boolean;
  passagers: number;
};

export type Filtres = {
  budget: number;
  dureeMax: number;       // en heures
  directs: boolean;
  escales: boolean;
  cabine: boolean;
  // On garde les compagnies DÉCOCHÉES : après une nouvelle recherche,
  // les nouvelles compagnies sont donc cochées automatiquement.
  compagniesExclues: string[];
};

export type Tri = "pertinence" | "prix" | "duree" | "depart";
export type Avis = "oui" | "non";