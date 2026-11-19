import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SurTitre } from "@/components/ui/SurTitre";
import { ErreurApi } from "@/lib/clientApi";
import { rechercherVols, type VolExplorer } from "@/features/auth/services/explorationApi";
import { useAuth } from "@/features/auth/contexte/useAuth";
import { modifierProfil } from "@/features/auth/services/api";

/**
 * Page de résultats : les offres initiales sont une démonstration, les recherches interrogent la base.
 */
type Vol = {
  id: string;
  compagnie: string;
  code: string;
  depart: string;
  arrivee: string;
  duree: number;
  prix: number;
  escale: string | null;
  cabine: boolean;
  message: string;
  lieuDepart: string;
  lieuArrivee: string;
};

const VOLS: Vol[] = [
  { id: "tp", compagnie: "TAP Air Portugal", code: "TP", depart: "09:40", arrivee: "11:10", duree: 150, prix: 168, escale: null, cabine: true, message: "Sous votre budget de 220 €, sans escale, avec votre bagage cabine.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "u2", compagnie: "easyJet", code: "U2", depart: "16:20", arrivee: "17:55", duree: 155, prix: 154, escale: null, cabine: false, message: "Le prix le plus bas de cette sélection. Bagage cabine en supplément.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "ib", compagnie: "Iberia", code: "IB", depart: "07:00", arrivee: "10:40", duree: 280, prix: 196, escale: "1 escale · Madrid", cabine: true, message: "Une alternative matinale par des profils proches, avec un bagage cabine.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
  { id: "vy", compagnie: "Vueling", code: "VY", depart: "12:10", arrivee: "16:20", duree: 310, prix: 212, escale: "1 escale · Barcelone", cabine: false, message: "Dans votre budget, mais plus long et sans bagage cabine inclus.", lieuDepart: "LYS · Lyon", lieuArrivee: "LIS · Lisbonne" },
];

function convertirVolExplorer(vol: VolExplorer): Vol {
  const libelleEscales = vol.escales_aller > 0
    ? `${vol.escales_aller} escale${vol.escales_aller > 1 ? "s" : ""}`
    : null;
  return {
    id: vol.id,
    compagnie: vol.compagnie_aller,
    code: vol.compagnie_aller.slice(0, 2).toUpperCase(),
    depart: vol.heure_depart ?? "--:--",
    arrivee: vol.heure_arrivee ?? "--:--",
    duree: vol.duree_aller_min,
    prix: vol.prix,
    escale: libelleEscales,
    cabine: vol.bagage_inclus === true,
    message: vol.simulee ? "Itinéraire simulé présent dans la base de données." : "Vol trouvé dans la base de données.",
    lieuDepart: `${vol.origine} · ${vol.ville_origine ?? "Départ"}`,
    lieuArrivee: `${vol.destination} · ${vol.ville_destination ?? "Arrivée"}`,
  };
}

function extraireCodeIata(lieu: string): string | null {
  return lieu.trim().match(/(?:^|\s)([a-z]{3})$/i)?.[1]?.toUpperCase() ?? null;
}

function Icone({ nom, className = "h-4 w-4" }: { nom: "avion" | "coeur" | "fleche" | "reglages" | "etoiles" | "info" | "horloge" | "oui" | "non"; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {nom === "avion" && <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l6-6" />}
      {nom === "coeur" && <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />}
      {nom === "fleche" && <path d="M4 12h16m-6-6 6 6-6 6" />}
      {nom === "reglages" && <><path d="M4 6h16M4 12h16M4 18h16" /><path d="M8 3v6m8 0v6m-7 0v6" /></>}
      {nom === "etoiles" && <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>}
      {nom === "info" && <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>}
      {nom === "horloge" && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
      {nom === "oui" && <path d="M7 10v11H3V10h4Zm0 0 5-8c3 0 2 5 2 7h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" />}
      {nom === "non" && <path d="M7 14V3H3v11h4Zm0 0 5 8c3 0 2-5 2-7h5a2 2 0 0 0 2-2l-2-8a2 2 0 0 0-2-2H7" />}
    </svg>
  );
}

function dureeLisible(minutes: number) {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

const boutonSecondaire = "inline-flex items-center justify-center gap-2 rounded-lg border border-trait bg-white px-4 py-2.5 text-xs font-medium text-principal transition hover:bg-fond focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal";

export default function PageResultats() {
  const naviguerVers = useNavigate();
  const { deconnecter, setUtilisateur, utilisateur } = useAuth();
  const [origine, setOrigine] = useState("Lyon LYS");
  const [destination, setDestination] = useState("Lisbonne LIS");
  const [vols, setVols] = useState(VOLS);
  const [budget, setBudget] = useState(220);
  const [allerRetour, setAllerRetour] = useState(true);
  const [passagers, setPassagers] = useState(1);
  const [dureeMax, setDureeMax] = useState(6);
  const [directs, setDirects] = useState(true);
  const [escales, setEscales] = useState(true);
  const [cabine, setCabine] = useState(false);
  const [compagnies, setCompagnies] = useState(VOLS.map((vol) => vol.id));
  const [tri, setTri] = useState("pertinence");
  const [favoris, setFavoris] = useState<string[]>([]);
  const [avis, setAvis] = useState<Record<string, "oui" | "non">>({});
  const [selection, setSelection] = useState<Vol | null>(null);
  const [edition, setEdition] = useState(false);
  const [aller, setAller] = useState("2027-06-12");
  const [retour, setRetour] = useState("2027-06-19");
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [erreurRecherche, setErreurRecherche] = useState<string | null>(null);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const [menuCompteOuvert, setMenuCompteOuvert] = useState(false);
  const [compteOuvert, setCompteOuvert] = useState(false);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const [profilPrenom, setProfilPrenom] = useState("");
  const [profilNom, setProfilNom] = useState("");
  const [enregistrementProfil, setEnregistrementProfil] = useState(false);
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);
  const [profilEnregistre, setProfilEnregistre] = useState(false);

  const dateAller = new Date(`${aller}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const dateRetour = new Date(`${retour}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const dates = allerRetour ? `${dateAller} – ${dateRetour}` : dateAller;
  const resultats = useMemo(() => {
    const liste = vols.filter((vol) => vol.prix <= budget && vol.duree <= dureeMax * 60 && compagnies.includes(vol.id) && (!cabine || vol.cabine) && (vol.escale ? escales : directs));
    if (tri === "prix") liste.sort((a, b) => a.prix - b.prix);
    if (tri === "duree") liste.sort((a, b) => a.duree - b.duree);
    if (tri === "depart") liste.sort((a, b) => a.depart.localeCompare(b.depart));
    return liste;
  }, [vols, budget, dureeMax, compagnies, cabine, escales, directs, tri]);

  function reinitialiser() {
    setBudget(220); setDureeMax(6); setDirects(true); setEscales(true);
    setCabine(false); setCompagnies(vols.map((vol) => vol.id));
  }

  async function lancerRecherche() {
    const codeOrigine = extraireCodeIata(origine);
    const codeDestination = extraireCodeIata(destination);
    if (!codeOrigine || !codeDestination) {
      setErreurRecherche("Saisissez le code IATA à trois lettres avec chaque ville (ex. Paris CDG).");
      return;
    }
    if (codeOrigine === codeDestination) {
      setErreurRecherche("Les aéroports de départ et d’arrivée doivent être différents.");
      return;
    }
    if (!aller || (allerRetour && !retour) || (allerRetour && retour < aller)) {
      setErreurRecherche("Vérifiez les dates de départ et de retour.");
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      setErreurRecherche("Le budget doit être supérieur à 0 €.");
      return;
    }

    setRechercheEnCours(true);
    setErreurRecherche(null);
    try {
      const volsTrouves = await rechercherVols({
        origine: codeOrigine,
        destination: codeDestination,
        date_depart: aller,
        date_retour: allerRetour ? retour : null,
        aller_retour: allerRetour,
        nb_passagers: passagers,
        budget_max: budget,
        devise: "EUR",
        direct_seulement: directs && !escales,
        bagage_requis: cabine,
      });
      const volsConvertis = volsTrouves.map(convertirVolExplorer);
      setVols(volsConvertis);
      setCompagnies(volsConvertis.map((vol) => vol.id));
      setFavoris(volsTrouves.filter((vol) => vol.favori).map((vol) => vol.id));
      setRechercheEffectuee(true);
      setEdition(false);
    } catch (erreur: unknown) {
      if (erreur instanceof ErreurApi && erreur.statut === 401) {
        setErreurRecherche("Connectez-vous pour rechercher des vols dans la base de données.");
      } else if (erreur instanceof ErreurApi && erreur.statut >= 500) {
        setErreurRecherche("Désolé, le vol que vous recherchez actuellement n’est pas disponible.");
      } else {
        setErreurRecherche(`La recherche dans la base de données a échoué : ${erreur instanceof Error ? erreur.message : "erreur inconnue."}`);
      }
    } finally {
      setRechercheEnCours(false);
    }
  }

  async function deconnecterCompte() {
    setDeconnexionEnCours(true);
    await deconnecter();
    naviguerVers("/connexion", { replace: true });
  }

  function ouvrirProfil() {
    setProfilPrenom(utilisateur?.prenom ?? "");
    setProfilNom(utilisateur?.nom ?? "");
    setErreurProfil(null);
    setProfilEnregistre(false);
    setCompteOuvert(true);
  }

  async function enregistrerProfil(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!utilisateur) return;

    setEnregistrementProfil(true);
    setErreurProfil(null);
    setProfilEnregistre(false);
    try {
      const utilisateurMisAJour = await modifierProfil({
        prenom: profilPrenom.trim(),
        nom: profilNom.trim(),
      });
      setUtilisateur(utilisateurMisAJour);
      setProfilPrenom(utilisateurMisAJour.prenom);
      setProfilNom(utilisateurMisAJour.nom);
      setProfilEnregistre(true);
    } catch (erreur: unknown) {
      setErreurProfil(`Impossible d’enregistrer le profil : ${erreur instanceof Error ? erreur.message : "erreur inconnue."}`);
    } finally {
      setEnregistrementProfil(false);
    }
  }

  const initiales = utilisateur
    ? `${utilisateur.prenom[0] ?? ""}${utilisateur.nom[0] ?? ""}`.toUpperCase()
    : "CM";

  function caseFiltre(texte: string, coche: boolean, changer: () => void) {
    return <label className="flex cursor-pointer items-center gap-2 text-[11px] leading-5 text-attenue"><input type="checkbox" checked={coche} onChange={changer} className="h-3.5 w-3.5 rounded accent-principal" />{texte}</label>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-trait bg-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6 lg:px-16">
          <Link to="/resultats" aria-label="Orca Flight, accueil" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-profond">
              <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden="true"><path fill="white" d="M6 29c7-4 12-11 17-23 1 9 0 15 8 22-7 5-17 7-25 1Z" /></svg>
            </span>
            <span className="text-sm font-semibold leading-none">Orca Flight<small className="mt-1 block text-[6px] font-medium tracking-[0.12em] text-attenue">LES ORQUES TACTIQUES</small></span>
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-7 text-[11px] md:flex">
            <Link to="/resultats" aria-current="page" className="font-semibold text-principal">Explorer</Link>
            <Link to="/explorer" className="text-attenue hover:text-principal">Mes favoris</Link>
            <Link to="/explorer" className="text-attenue hover:text-principal">Historique</Link>
            <Link to="/explorer" className="text-attenue hover:text-principal">Comparateur</Link>
          </nav>
          <div className="relative flex items-center gap-2 text-[10px]">
            <button type="button" aria-label="Ouvrir le menu du compte" aria-haspopup="menu" aria-expanded={menuCompteOuvert} onClick={() => setMenuCompteOuvert((ouvert) => !ouvert)} onKeyDown={(e) => { if (e.key === "Escape") setMenuCompteOuvert(false); }} className="flex items-center gap-2 text-encre focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-principal">
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-profond text-[8px] font-semibold text-white">{initiales}</span>
              {utilisateur?.prenom ?? "Camille"} <span aria-hidden="true" className="text-attenue">⌄</span>
            </button>
            {menuCompteOuvert && <>
              <button type="button" aria-label="Fermer le menu du compte" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuCompteOuvert(false)} />
              <div role="menu" aria-label="Menu du compte" className="absolute right-0 top-full z-40 mt-2 w-44 rounded-lg border border-trait bg-white p-1.5 shadow-lg">
                <Link to="/mon-compte" role="menuitem" className="block w-full rounded-md px-3 py-2 text-left text-xs text-encre hover:bg-fond focus-visible:outline-2 focus-visible:outline-principal" onClick={() => setMenuCompteOuvert(false)}>Mon compte</Link>
                <button type="button" role="menuitem" className="w-full rounded-md px-3 py-2 text-left text-xs text-encre hover:bg-fond focus-visible:outline-2 focus-visible:outline-principal" onClick={() => { setMenuCompteOuvert(false); ouvrirProfil(); }}>Aperçu rapide du profil</button>
                <button type="button" role="menuitem" disabled={deconnexionEnCours} className="w-full rounded-md px-3 py-2 text-left text-xs text-encre hover:bg-fond focus-visible:outline-2 focus-visible:outline-principal disabled:opacity-60" onClick={() => void deconnecterCompte()}>{deconnexionEnCours ? "Déconnexion…" : "Se déconnecter"}</button>
              </div>
            </>}
          </div>
        </div>
      </header>
      <main className="flex-1">
      <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16 lg:py-9">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-trait bg-white px-5 py-4">
        <div className="flex items-center gap-4">
          <span className="text-principal"><Icone nom="avion" /></span>
          <div>
            <h2 className="flex items-center gap-1 text-base">
              <input aria-label="Ville et aéroport de départ" value={origine} onChange={(e) => setOrigine(e.target.value)} className="min-w-0 bg-transparent outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-principal" style={{ width: `${Math.min(Math.max(origine.length, 6), 18)}ch` }} />
              <span aria-hidden="true">→</span>
              <input aria-label="Ville et aéroport d’arrivée" value={destination} onChange={(e) => setDestination(e.target.value)} className="min-w-0 bg-transparent outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-principal" style={{ width: `${Math.min(Math.max(destination.length, 6), 18)}ch` }} />
            </h2>
            <p className="mt-1 text-[11px] text-attenue">{dates} · {allerRetour ? "Aller-retour" : "Aller simple"} · {passagers} adulte{passagers > 1 ? "s" : ""} · Budget {budget} €</p>
          </div>
        </div>
        <button type="button" className={boutonSecondaire} onClick={() => setEdition(!edition)} aria-expanded={edition}>Modifier la recherche <Icone nom="reglages" /></button>
      </div>

      {edition && <div className="mt-3 flex flex-wrap items-end gap-4 rounded-xl border border-trait bg-white p-5">
        <label className="grid gap-2 text-xs text-attenue">Aller<input type="date" value={aller} max={allerRetour ? retour : undefined} onChange={(e) => { if (e.target.value) setAller(e.target.value); }} className="rounded-lg border border-trait p-2 text-encre" /></label>
        <label className="grid gap-2 text-xs text-attenue">Retour<input type="date" value={retour} min={aller} disabled={!allerRetour} onChange={(e) => { if (e.target.value) setRetour(e.target.value); }} className="rounded-lg border border-trait p-2 text-encre disabled:opacity-50" /></label>
        <label className="grid gap-2 text-xs text-attenue">Trajet<select value={allerRetour ? "aller-retour" : "aller-simple"} onChange={(e) => setAllerRetour(e.target.value === "aller-retour")} className="rounded-lg border border-trait bg-white p-2 text-encre"><option value="aller-retour">Aller-retour</option><option value="aller-simple">Aller simple</option></select></label>
        <label className="grid gap-2 text-xs text-attenue">Passagers<select value={passagers} onChange={(e) => setPassagers(Number(e.target.value))} className="rounded-lg border border-trait bg-white p-2 text-encre">{Array.from({ length: 9 }, (_, index) => index + 1).map((nombre) => <option key={nombre} value={nombre}>{nombre} adulte{nombre > 1 ? "s" : ""}</option>)}</select></label>
        <label className="grid gap-2 text-xs text-attenue">Budget maximum (€)<input type="number" min="1" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-36 rounded-lg border border-trait p-2 text-encre" /></label>
        <button type="button" className={boutonSecondaire} onClick={() => void lancerRecherche()} disabled={rechercheEnCours}>{rechercheEnCours ? "Recherche…" : "Rechercher dans la base"}</button>
        <button type="button" className={boutonSecondaire} onClick={() => setEdition(false)}>Fermer</button>
        <p className="w-full text-xs text-attenue">Pour les villes, indiquez aussi le code IATA à trois lettres (ex. Paris CDG). La recherche utilise les vols enregistrés dans la base.</p>
        {erreurRecherche && <p role="alert" className="w-full text-xs text-erreur">{erreurRecherche}</p>}
      </div>}

      <header className="mb-5 mt-6">
        <SurTitre>Votre sélection, expliquée</SurTitre>
        <h1 className="mt-2 text-[32px] font-normal leading-tight tracking-tight sm:text-[40px]" aria-live="polite">{resultats.length} vol{resultats.length > 1 ? "s" : ""}. Et de bonnes raisons.</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-attenue">{rechercheEffectuee ? "Résultats de la base de données · Prix par personne." : "Exemples de démonstration · Prix A/R par personne, taxes incluses."}</p>
          <Link to="/explorer" className="text-[10px] font-medium text-principal hover:underline">Voir mon historique <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4" aria-label="Filtres de recherche">
          <div className="rounded-xl border border-trait bg-white p-5">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-medium">Filtres</h2><button type="button" onClick={reinitialiser} className="text-[10px] text-principal hover:underline">Réinitialiser</button></div>
            <label className="block text-xs">Budget A/R · {budget} € max<input type="range" min="100" max={Math.max(220, budget)} step="1" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 block w-full accent-principal" /></label>
            <div className="mt-1 flex justify-between text-[10px] text-attenue"><span>100 €</span><span>{Math.max(220, budget)} €</span></div>
            <fieldset className="mt-5 space-y-1"><legend className="mb-2 text-xs font-medium">Escales</legend>{caseFiltre(`Vols directs (${vols.filter((vol) => !vol.escale).length})`, directs, () => setDirects(!directs))}{caseFiltre(`Avec escale (${vols.filter((vol) => vol.escale).length})`, escales, () => setEscales(!escales))}</fieldset>
            <fieldset className="mt-5 space-y-1"><legend className="mb-2 text-xs font-medium">Bagages inclus</legend>{caseFiltre("Tous les tarifs", !cabine, () => setCabine(!cabine))}{caseFiltre("Cabine uniquement", cabine, () => setCabine(!cabine))}</fieldset>
            <label className="mt-5 block text-xs font-medium">Durée maximale à l’aller<span className="mt-2 flex items-center gap-2 rounded-lg border border-trait px-3 py-2 text-principal"><Icone nom="horloge" /><select value={dureeMax} onChange={(e) => setDureeMax(Number(e.target.value))} className="w-full bg-transparent text-xs text-encre"><option value={3}>3 h</option><option value={4}>4 h</option><option value={5}>5 h</option><option value={6}>6 h</option></select></span></label>
            <fieldset className="mt-5 space-y-1"><legend className="mb-2 text-xs font-medium">Compagnies</legend>{vols.map((vol) => <div key={vol.id}>{caseFiltre(vol.compagnie, compagnies.includes(vol.id), () => setCompagnies((precedentes) => precedentes.includes(vol.id) ? precedentes.filter((id) => id !== vol.id) : [...precedentes, vol.id]))}</div>)}</fieldset>
          </div>
          <Encart titre="Pourquoi cet ordre ?" icone="etoiles">Vos critères et les choix de profils proches sont combinés. Les raisons restent visibles sur chaque vol.</Encart>
          <Encart titre="Première connexion ?" icone="info">Sans historique, l’approche A s’appuie déjà sur vos critères. Les découvertes collaboratives viendront ensuite.</Encart>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <span className="rounded bg-menthe px-2 py-1 font-medium text-profond">Hybride · A + 0,5B</span>
            <label className="flex items-center gap-2 text-attenue">Trier par<select value={tri} onChange={(e) => setTri(e.target.value)} className="rounded-lg border border-trait bg-white px-3 py-2 text-principal"><option value="pertinence">Pertinence</option><option value="prix">Prix croissant</option><option value="duree">Durée la plus courte</option><option value="depart">Départ le plus tôt</option></select></label>
          </div>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-attenue"><span>Autres tris :</span><button onClick={() => setTri("prix")} className="hover:text-principal">Prix croissant</button><span>·</span><button onClick={() => setTri("duree")} className="hover:text-principal">Durée la plus courte</button><span>·</span><button onClick={() => setTri("depart")} className="hover:text-principal">Départ le plus tôt</button></div>

          <div className="space-y-4">
            {resultats.map((vol, index) => <article key={vol.id} className={`rounded-xl border bg-white p-5 ${vol.id === "tp" ? "border-principal/40" : "border-trait"}`}>
              <div className="flex items-center gap-2 text-[11px]"><span className="mr-1 text-attenue">{String(index + 1).padStart(2, "0")}</span><span className="flex h-7 w-7 items-center justify-center rounded-md bg-menthe text-[10px] text-principal">{vol.code}</span><h2>{vol.compagnie}</h2>{vol.id === "tp" && <span className="rounded-full bg-citron px-2 py-1 text-[9px] font-semibold text-profond">Meilleur équilibre</span>}<button type="button" aria-label={`${favoris.includes(vol.id) ? "Retirer" : "Ajouter"} ${vol.compagnie} ${favoris.includes(vol.id) ? "des" : "aux"} favoris`} aria-pressed={favoris.includes(vol.id)} onClick={() => setFavoris((precedents) => precedents.includes(vol.id) ? precedents.filter((id) => id !== vol.id) : [...precedents, vol.id])} className={`ml-auto rounded p-1 text-principal ${favoris.includes(vol.id) ? "bg-menthe [&_svg]:fill-principal" : "hover:bg-fond"}`}><Icone nom="coeur" /></button></div>
              <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:grid-cols-[auto_1fr_auto_115px]">
                <div><p className="text-2xl font-semibold tracking-tight">{vol.depart}</p><p className="mt-1 text-[10px] text-attenue">{vol.lieuDepart}</p></div>
                <div className="text-center"><p className="mb-2 text-[10px] text-attenue">{dureeLisible(vol.duree)}</p><div className="relative h-px bg-trait"><span className="absolute -top-0.5 left-0 h-1 w-1 rounded-full bg-principal" /><span className="absolute -top-1.5 right-0 bg-white pl-1 text-principal"><Icone nom="avion" className="h-3 w-3" /></span></div><p className="mt-2 text-[9px] text-principal">{vol.escale ?? "Direct"}</p></div>
                <div><p className="text-2xl font-semibold tracking-tight">{vol.arrivee}</p><p className="mt-1 text-[10px] text-attenue">{vol.lieuArrivee}</p></div>
                <div className="col-span-3 text-right sm:col-span-1"><p className="text-2xl tracking-tight">{vol.prix} €</p><p className="text-[9px] text-attenue">aller-retour / pers.</p></div>
              </div>
              <div className="mt-3 flex justify-between gap-3 text-[10px] text-attenue"><span>{vol.cabine ? "Cabine 10 kg incluse" : rechercheEffectuee ? "Bagage non inclus ou non renseigné" : "Petit sac inclus"}</span><span>{dates}</span></div>
              <div className="mt-3 flex items-start gap-2 rounded-md bg-menthe/80 px-3 py-2.5 text-[11px] leading-relaxed text-profond"><span className="shrink-0 text-principal"><Icone nom="etoiles" className="h-3.5 w-3.5" /></span>{vol.message}</div>
              <div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] text-attenue"><span>Ce vol vous correspond ?</span>{(["oui", "non"] as const).map((reponse) => <button key={reponse} type="button" aria-label={reponse === "oui" ? "Ce vol me correspond" : "Ce vol ne me correspond pas"} aria-pressed={avis[vol.id] === reponse} onClick={() => setAvis((precedents) => ({ ...precedents, [vol.id]: reponse }))} className={`rounded p-1 ${avis[vol.id] === reponse ? "bg-menthe text-principal" : "hover:text-principal"}`}><Icone nom={reponse} className="h-3.5 w-3.5" /></button>)}</div><button type="button" onClick={() => setSelection(vol)} className={vol.id === "tp" ? "inline-flex items-center gap-2 rounded-lg bg-principal px-4 py-2.5 text-xs text-white transition hover:bg-principal-fonce" : boutonSecondaire}>Voir le vol <Icone nom="fleche" className="h-3.5 w-3.5" /></button></div>
            </article>)}
            {resultats.length === 0 && <div role="status" className="rounded-xl border border-trait bg-white p-8 text-center"><h2 className="text-xl">Aucun vol avec ces critères.</h2><p className="my-3 text-sm text-attenue">Augmentez votre budget ou assouplissez vos filtres.</p><button onClick={reinitialiser} className={boutonSecondaire}>Réinitialiser les filtres</button></div>}
          </div>
          <p className="mt-5 text-center text-[10px] text-attenue">Vous avez vu {resultats.length} offre{resultats.length > 1 ? "s" : ""} {rechercheEffectuee ? "correspondant à votre recherche en base." : "de cette sélection de démonstration."}</p>
        </div>
      </div>

      <div className="mt-7 grid overflow-hidden rounded-xl border border-trait md:grid-cols-2">
        <div className="bg-white p-6"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-attenue">État associé · Aucun résultat</p><h2 className="mt-3 text-lg font-semibold">Un peu plus de souplesse ?</h2><p className="mb-4 mt-2 text-xs leading-6 text-attenue">Aucun vol ne correspond à ces filtres. Élargissez votre budget ou acceptez une escale, sans perdre votre recherche.</p><button type="button" onClick={reinitialiser} className={boutonSecondaire}>Réinitialiser les filtres</button></div>
        <div className="bg-menthe/70 p-6" aria-live="polite"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-principal">État associé · Avis enregistré</p><h2 className="mt-3 text-lg font-semibold">{Object.keys(avis).length ? "Merci, votre avis est enregistré." : "Merci, on affine le cap."}</h2><p className="mt-2 text-xs leading-6 text-attenue">{Object.keys(avis).length ? "Votre retour est conservé pendant cette visite. Dans cette démonstration, il ne modifie pas le classement." : "Votre avis « Ce vol me correspond » aidera à préciser vos préférences. Le profil et le classement pourront être actualisés avec votre accord."}</p><p className="mt-3 text-[10px] font-semibold text-profond">Démonstration · Données non persistées</p></div>
      </div>

      {selection && <div className="fixed inset-0 z-50 overflow-y-auto bg-encre/40 p-6" onClick={() => setSelection(null)}><section role="dialog" aria-modal="true" aria-label="Détail du vol" className="mx-auto my-[10vh] max-w-lg rounded-2xl bg-white p-7 shadow-xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") setSelection(null); }}><h2 className="text-2xl">{selection.compagnie} · {selection.prix} €</h2><p className="mt-4 text-sm text-attenue">{selection.lieuDepart} → {selection.lieuArrivee} · {dates}</p><p className="mt-2 text-sm">{selection.depart} → {selection.arrivee} · {dureeLisible(selection.duree)}</p><p className="mt-4 rounded-lg bg-menthe p-4 text-xs leading-6">{rechercheEffectuee ? "Vol trouvé dans la base de données. Aucun billet ne peut être réservé ici." : "Offre fictive de démonstration. Aucun billet ne peut être réservé ici."} Les détails complets du retour ne sont pas fournis.</p><button autoFocus type="button" onClick={() => setSelection(null)} className={`${boutonSecondaire} mt-5`}>Fermer</button></section></div>}
      {compteOuvert && <div className="fixed inset-0 z-50 overflow-y-auto bg-encre/40 p-6" onClick={() => setCompteOuvert(false)}>
        <section role="dialog" aria-modal="true" aria-label="Mon profil" className="relative mx-auto my-[10vh] max-w-lg rounded-2xl bg-white p-7 shadow-xl" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") setCompteOuvert(false); }}>
          <button autoFocus type="button" aria-label="Fermer" onClick={() => setCompteOuvert(false)} className="absolute right-4 top-2 text-2xl text-attenue">×</button>
          <h2 className="text-2xl">Mon profil</h2>
          {utilisateur ? <>
            <p className="mt-3 text-xs text-attenue">Modifiez vos informations personnelles ci-dessous.</p>
            <form onSubmit={(e) => void enregistrerProfil(e)} className="mt-4 space-y-3">
              <label className="grid gap-1.5 text-xs text-attenue">Prénom<input required minLength={2} maxLength={100} value={profilPrenom} onChange={(e) => setProfilPrenom(e.target.value)} className="rounded-lg border border-trait p-2.5 text-encre" /></label>
              <label className="grid gap-1.5 text-xs text-attenue">Nom<input required minLength={2} maxLength={100} value={profilNom} onChange={(e) => setProfilNom(e.target.value)} className="rounded-lg border border-trait p-2.5 text-encre" /></label>
              <label className="grid gap-1.5 text-xs text-attenue">Adresse e-mail<input readOnly value={utilisateur.email} className="rounded-lg border border-trait bg-fond p-2.5 text-encre" /></label>
              <p className="text-[10px] text-attenue">L’adresse e-mail n’est pas modifiable depuis cette page.</p>
              {erreurProfil && <p role="alert" className="text-xs text-erreur">{erreurProfil}</p>}
              {profilEnregistre && <p role="status" className="text-xs text-principal">Votre profil a été mis à jour.</p>}
              <button type="submit" disabled={enregistrementProfil} className="inline-flex items-center justify-center rounded-lg bg-principal px-4 py-2.5 text-xs font-medium text-white transition hover:bg-principal-fonce disabled:opacity-60">{enregistrementProfil ? "Enregistrement…" : "Enregistrer les modifications"}</button>
            </form>
          </> : <p className="mt-4 text-sm text-attenue">Connectez-vous pour consulter et modifier votre profil.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={deconnexionEnCours} onClick={() => void deconnecterCompte()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-principal px-4 py-2.5 text-xs font-medium text-white transition hover:bg-principal-fonce disabled:opacity-60">{deconnexionEnCours ? "Déconnexion…" : "Se connecter à un autre compte"}</button>
            <button type="button" disabled={deconnexionEnCours} onClick={() => void deconnecterCompte()} className={`${boutonSecondaire} disabled:opacity-60`}>Se déconnecter</button>
          </div>
          <button type="button" onClick={() => setCompteOuvert(false)} className={`${boutonSecondaire} mt-5`}>Terminer</button>
        </section>
      </div>}
      </section>
      </main>
      <footer className="border-t border-trait bg-white text-[9px] text-attenue">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-16">
          <p>Les Orques tactiques · SAÉ BUT3 5.Real.01 · v0.1.0</p>
          <p>{rechercheEffectuee && "Offres issues de la base de données · "}Aucune réservation sur Orca Flight</p>
          <p className="flex gap-3 font-medium text-principal"><Link to="/confidentialite">Confidentialité</Link><Link to="/conditions">Conditions d’utilisation</Link></p>
        </div>
      </footer>
    </div>
  );
}

function Encart({ titre, icone, children }: { titre: string; icone: "etoiles" | "info"; children: React.ReactNode }) {
  return <div className="flex gap-3 rounded-lg bg-menthe/75 p-4"><span className="mt-0.5 shrink-0 text-principal"><Icone nom={icone} /></span><div><h3 className="text-[11px] font-medium">{titre}</h3><p className="mt-1 text-[10px] leading-relaxed text-attenue">{children}</p></div></div>;
}