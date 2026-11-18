export type ApprocheId = "A" | "B" | "HYBRIDE";

export interface VolComparaison {
  id: string;
  compagnie: string;
  escaleLabel: string;
  prixEur: number;
  scoreA: number;
  scoreB: number;
}

export interface MetriqueQualite {
  label: string;
  sens: "↑" | "↓";
  valeurA: string;
  valeurB: string;
  valeurHybride: string;
}

export interface ProfilDemoComparateur {
  id: string;
  nom: string;
  initiales: string;
  prenom: string;
  nbInteractions: number;
  trajetLabel: string;
  vols: VolComparaison[];
  metriques: MetriqueQualite[];
}

export const PROFILS_DEMO: ProfilDemoComparateur[] = [
  {
    id: "camille",
    nom: "Camille Martin · 8 interactions",
    initiales: "CM",
    prenom: "Camille",
    nbInteractions: 8,
    trajetLabel: "LYS → LIS · 12–19 juin 2027 · 220 €",
    vols: [
      {
        id: "tap-direct",
        compagnie: "TAP",
        escaleLabel: "Direct",
        prixEur: 168,
        scoreA: 0.92,
        scoreB: 0.78,
      },
      {
        id: "easyjet-direct",
        compagnie: "easyJet",
        escaleLabel: "Direct",
        prixEur: 154,
        scoreA: 0.88,
        scoreB: 0.71,
      },
      {
        id: "iberia-mad",
        compagnie: "Iberia",
        escaleLabel: "Madrid",
        prixEur: 196,
        scoreA: 0.74,
        scoreB: 0.85,
      },
      {
        id: "vueling-bcn",
        compagnie: "Vueling",
        escaleLabel: "Barcelone",
        prixEur: 212,
        scoreA: 0.61,
        scoreB: 0.69,
      },
    ],
    metriques: [
      { label: "Temps de réponse", sens: "↓", valeurA: "42 ms", valeurB: "68 ms", valeurHybride: "79 ms" },
      { label: "Précision@5", sens: "↑", valeurA: "0,80", valeurB: "0,60", valeurHybride: "0,80" },
      { label: "NDCG@5", sens: "↑", valeurA: "0,84", valeurB: "0,71", valeurHybride: "0,87" },
      { label: "Énergie", sens: "↓", valeurA: "0,12", valeurB: "0,19", valeurHybride: "0,23" },
    ],
  },
  {
    id: "thomas-gru",
    nom: "Thomas Leroy · 14 interactions",
    initiales: "TL",
    prenom: "Thomas",
    nbInteractions: 14,
    trajetLabel: "CDG → GRU · 8–15 déc. 2026 · 1 150 €",
    vols: [
      {
        id: "af-direct",
        compagnie: "Air France",
        escaleLabel: "Direct",
        prixEur: 1114,
        scoreA: 0.95,
        scoreB: 0.82,
      },
      {
        id: "latam-direct",
        compagnie: "LATAM",
        escaleLabel: "Direct",
        prixEur: 1276,
        scoreA: 0.83,
        scoreB: 0.89,
      },
      {
        id: "ba-lhr",
        compagnie: "British Airways",
        escaleLabel: "Londres LHR",
        prixEur: 1052,
        scoreA: 0.72,
        scoreB: 0.76,
      },
      {
        id: "ram-cmn",
        compagnie: "Royal Air Maroc",
        escaleLabel: "Casablanca",
        prixEur: 1118,
        scoreA: 0.58,
        scoreB: 0.64,
      },
    ],
    metriques: [
      { label: "Temps de réponse", sens: "↓", valeurA: "45 ms", valeurB: "71 ms", valeurHybride: "82 ms" },
      { label: "Précision@5", sens: "↑", valeurA: "0,82", valeurB: "0,65", valeurHybride: "0,85" },
      { label: "NDCG@5", sens: "↑", valeurA: "0,85", valeurB: "0,74", valeurHybride: "0,89" },
      { label: "Énergie", sens: "↓", valeurA: "0,13", valeurB: "0,20", valeurHybride: "0,24" },
    ],
  },
  {
    id: "nouveau-coldstart",
    nom: "Nouveau visiteur · 0 interaction",
    initiales: "NV",
    prenom: "Visiteur",
    nbInteractions: 0,
    trajetLabel: "LYS → LIS · 12–19 juin 2027 · 220 €",
    vols: [
      {
        id: "tap-direct",
        compagnie: "TAP",
        escaleLabel: "Direct",
        prixEur: 168,
        scoreA: 0.92,
        scoreB: 0.0,
      },
      {
        id: "easyjet-direct",
        compagnie: "easyJet",
        escaleLabel: "Direct",
        prixEur: 154,
        scoreA: 0.88,
        scoreB: 0.0,
      },
      {
        id: "iberia-mad",
        compagnie: "Iberia",
        escaleLabel: "Madrid",
        prixEur: 196,
        scoreA: 0.74,
        scoreB: 0.0,
      },
      {
        id: "vueling-bcn",
        compagnie: "Vueling",
        escaleLabel: "Barcelone",
        prixEur: 212,
        scoreA: 0.61,
        scoreB: 0.0,
      },
    ],
    metriques: [
      { label: "Temps de réponse", sens: "↓", valeurA: "39 ms", valeurB: "—", valeurHybride: "41 ms" },
      { label: "Précision@5", sens: "↑", valeurA: "0,80", valeurB: "—", valeurHybride: "0,80" },
      { label: "NDCG@5", sens: "↑", valeurA: "0,84", valeurB: "—", valeurHybride: "0,84" },
      { label: "Énergie", sens: "↓", valeurA: "0,12", valeurB: "—", valeurHybride: "0,12" },
    ],
  },
];