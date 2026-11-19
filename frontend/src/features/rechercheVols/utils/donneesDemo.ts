import type { Vol } from "./types";

/** Offres fictives affichées avant la première recherche. */
export const VOLS_DEMO: Vol[] = [
  { id: "tp", compagnie: "TAP Air Portugal", code: "TP", depart: "09:40", arrivee: "11:10", duree: 150, prix: 168, escale: null, cabine: true, message: "Sous votre budget de 220 €, sans escale, avec votre bagage cabine.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "u2", compagnie: "easyJet", code: "U2", depart: "16:20", arrivee: "17:55", duree: 155, prix: 154, escale: null, cabine: false, message: "Le prix le plus bas de cette sélection. Bagage cabine en supplément.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "ib", compagnie: "Iberia", code: "IB", depart: "07:00", arrivee: "10:40", duree: 280, prix: 196, escale: "1 escale · Madrid", cabine: true, message: "Une alternative matinale par des profils proches, avec un bagage cabine.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "vy", compagnie: "Vueling", code: "VY", depart: "12:10", arrivee: "16:20", duree: 310, prix: 212, escale: "1 escale · Barcelone", cabine: false, message: "Dans votre budget, mais plus long et sans bagage cabine inclus.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
];