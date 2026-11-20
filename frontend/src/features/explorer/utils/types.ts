export interface RechercheVols {
  origine: string;
  destination: string;
  date_depart: string;
  date_retour: string | null;
  aller_retour: boolean;
  nb_passagers: number;
  budget_max: number;
  devise: string;
  direct_seulement: boolean;
}

export interface VolExplorer {
  id: string;
  origine: string;
  destination: string;
  date_depart: string;
  date_retour: string | null;
  aller_retour: boolean;
  prix: number;
  devise: string;
  compagnie_aller: string;
  duree_aller_min: number;
  escales_aller: number;
  simulee: boolean;
  heure_depart: string | null;
  heure_arrivee: string | null;
  ville_origine: string | null;
  ville_destination: string | null;
  favori: boolean;
}

export interface RechercheHistorique {
  id: string;
  origine: string | null;
  destination: string | null;
  pays_destination: string | null;
  ville_destination: string | null;
  date_depart: string | null;
  date_retour: string | null;
  aller_retour: boolean;
  nb_passagers: number;
  budget_max: number | null;
  autres_criteres: Record<string, unknown>;
  relancable: boolean;
  cree_le: string | null;
}