import { appelerApi } from "@/lib/clientApi";

// AeroportOut
export interface Aeroport {
  code_iata: string;
  nom: string;
  ville: string | null;
  code_pays: string | null;
  pays: string | null;
  libelle: string;                 // « Paris (CDG), France »
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  image_credit: string | null;     // à afficher avec l'image
  lien_wikipedia: string | null;
}

// PaysOut
export interface Pays {
  code_pays: string;
  nom: string;
}

export const rechercherAeroports = (q: string, limite = 10) =>
  appelerApi<Aeroport[]>(`/api/aeroports?q=${encodeURIComponent(q)}&limite=${limite}`);

export const lireDestinations = () => appelerApi<Aeroport[]>("/api/aeroports/destinations");

export const lireAeroport = (codeIata: string) =>
  appelerApi<Aeroport>(`/api/aeroports/${encodeURIComponent(codeIata)}`);

export const aeroportPlusProche = (latitude: number, longitude: number) =>
  appelerApi<Aeroport>(`/api/aeroports/plus-proche?latitude=${latitude}&longitude=${longitude}`);

export const listerPays = () => appelerApi<Pays[]>("/api/pays");

export const lirePays = (codePays: string) =>
  appelerApi<Pays>(`/api/pays/${encodeURIComponent(codePays)}`);