import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/contexte/useAuth";
import {
  definirFavori,
  lireFavoris,
  lireHistorique,
  rechercherVols,
  type RechercheHistorique,
  type VolExplorer,
} from "@/features/auth/services/explorationApi";

/**
 * La page inclut son header : ne pas la placer dans un layout qui le répète.
 */
type IconName = "plane" | "search" | "heart" | "pin" | "calendar" | "user" | "wallet" | "sparkles" | "arrow" | "chevron" | "target";
function Icon({ name, size = 16, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const paths: Record<IconName, ReactNode> = {
    plane: <><path d="m22 2-7 20-4-9-9-4L22 2Z"/><path d="M22 2 11 13"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M15 12h6v5h-6Z"/></>,
    sparkles: <><path d="m9 2 2.5 6.5L18 11l-6.5 2.5L9 20l-2.5-6.5L0 11l6.5-2.5L9 2ZM19 1v6m-3-3h6M20 16v6m-3-3h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    target: <><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Field({ label, icon, children, className = "" }: { label: string; icon?: IconName; children: ReactNode; className?: string }) {
  return <label className={`oq-field ${className}`}><span>{label}</span><div className="oq-input">{icon && <Icon name={icon} size={15} />}{children}</div></label>;
}

function messageErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : "Une erreur inattendue est survenue.";
}

function formaterDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const minutesRestantes = minutes % 60;
  return heures ? `${heures} h ${minutesRestantes.toString().padStart(2, "0")}` : `${minutesRestantes} min`;
}

export default function PageExplorer() {
  const naviguerVers = useNavigate();
  const { deconnecter, utilisateur } = useAuth();
  const [roundTrip, setRoundTrip] = useState(true);
  const [tab, setTab] = useState("Explorer");
  const [flights, setFlights] = useState<VolExplorer[]>([]);
  const [favorites, setFavorites] = useState<VolExplorer[]>([]);
  const [history, setHistory] = useState<RechercheHistorique[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [direct, setDirect] = useState(true);
  const [bagageRequis, setBagageRequis] = useState(true);
  const [budget, setBudget] = useState("220");
  const [devise, setDevise] = useState("EUR");
  const [passagers, setPassagers] = useState(1);
  const [departureDate, setDepartureDate] = useState("2027-06-12");
  const [returnDate, setReturnDate] = useState("2027-06-19");
  const [locationNotice, setLocationNotice] = useState("Localisation non autorisée · La saisie manuelle prend le relais");
  const [chargement, setChargement] = useState(true);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [favorisEnCours, setFavorisEnCours] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  useEffect(() => {
    let actif = true;
    Promise.all([lireFavoris(), lireHistorique()])
      .then(([volsFavoris, recherches]) => {
        if (actif) {
          setFavorites(volsFavoris);
          setHistory(recherches);
        }
      })
      .catch((erreurRequete: unknown) => {
        if (actif) setErreur(`Impossible de charger vos données : ${messageErreur(erreurRequete)}`);
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => { actif = false; };
  }, []);

  const changerDeCompte = async () => {
    setDeconnexionEnCours(true);
    await deconnecter();
    naviguerVers("/connexion", { replace: true });
  };
  const toggleFavorite = async (vol: VolExplorer) => {
    if (favorisEnCours.includes(vol.id)) return;
    const nouveauStatut = !vol.favori;
    setFavorisEnCours(current => [...current, vol.id]);
    setErreur(null);
    try {
      await definirFavori(vol.id, nouveauStatut);
      const volMisAJour = { ...vol, favori: nouveauStatut };
      setFlights(current => current.map(item => item.id === vol.id ? volMisAJour : item));
      setFavorites(current => nouveauStatut
        ? [volMisAJour, ...current.filter(item => item.id !== vol.id)]
        : current.filter(item => item.id !== vol.id));
    } catch (erreurRequete: unknown) {
      setErreur(`Impossible de modifier ce favori : ${messageErreur(erreurRequete)}`);
    } finally {
      setFavorisEnCours(current => current.filter(id => id !== vol.id));
    }
  };
  const lancerRecherche = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRechercheEnCours(true);
    setFlights([]);
    setErreur(null);
    try {
      const resultats = await rechercherVols({
        origine: "LYS",
        destination: "LIS",
        date_depart: departureDate,
        date_retour: roundTrip ? returnDate : null,
        aller_retour: roundTrip,
        nb_passagers: passagers,
        budget_max: Number(budget),
        devise,
        direct_seulement: direct,
        bagage_requis: bagageRequis,
      });
      setFlights(resultats);
      setTab("Explorer");
      setHistory(await lireHistorique());
    } catch (erreurRequete: unknown) {
      setErreur(`La recherche n’a pas abouti : ${messageErreur(erreurRequete)}`);
    } finally {
      setRechercheEnCours(false);
    }
  };
  const dateLabel = (date: string | null) => date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Date inconnue";
  const shown = tab === "Mes favoris" ? favorites : flights;
  const nomAffiche = utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : "Mon compte";
  const initiales = utilisateur ? `${utilisateur.prenom[0] ?? ""}${utilisateur.nom[0] ?? ""}`.toUpperCase() : "??";

  return (
    <div className="orque-page">
      <style>{styles}</style>
      <header className="oq-header">
        <div className="oq-topbar">
          <a className="oq-brand" href="#" aria-label="Orque, accueil" onClick={e => { e.preventDefault(); setTab("Explorer"); }}>
            <span className="oq-mark"><svg viewBox="0 0 40 40" aria-hidden="true"><path fill="white" d="M6 29c7-4 12-11 17-23 1 9 0 15 8 22-7 5-17 7-25 1Z"/></svg></span>
            <span className="oq-wordmark">orque<small>LES ORQUES TACTIQUES</small></span>
          </a>
          <nav className="oq-nav" aria-label="Navigation principale">{["Explorer", "Mes favoris", "Historique", "Comparateur"].map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
          <div className="oq-account"><span className="oq-avatar">{initiales}</span><button onClick={() => setModal("Mon profil")}>{utilisateur?.prenom ?? "Mon compte"} <Icon name="chevron" size={12}/></button></div>
        </div>
      </header>

      <main className="oq-main">
        <section className="oq-hero">
          <div className="oq-hero-copy"><span className="oq-eyebrow">VOTRE HORIZON, VOTRE RYTHME</span><h1>Bonjour {utilisateur?.prenom ?? "voyageur"}, où s’envole-t-on ?</h1><p>On garde le cap sur vos envies. À vous de choisir la destination.</p></div>
          <div className="oq-photo" role="img" aria-label="Vue de Lisbonne et du Tage au coucher du soleil" />
        </section>

        <form className="oq-search-panel" onSubmit={lancerRecherche}>
          <div className="oq-form-top"><div className="oq-trip"><button type="button" aria-pressed={roundTrip} className={roundTrip ? "selected" : ""} onClick={() => setRoundTrip(true)}>Aller-retour</button><button type="button" aria-pressed={!roundTrip} className={!roundTrip ? "selected" : ""} onClick={() => setRoundTrip(false)}>Aller simple</button></div><button type="button" className="oq-location" onClick={() => setLocationNotice("Localisation indisponible dans cette démo · Votre départ reste Lyon") }><Icon name="target" size={14}/> Utiliser ma position · facultatif</button></div>
          <div className="oq-journey-grid">
            <div className="oq-place"><h2>AU DÉPART DE</h2><div className="oq-two"><Field label="Pays" icon="chevron"><select defaultValue="France"><option>France</option></select></Field><Field label="Ville"><input defaultValue="Lyon" readOnly /></Field></div><Field label="Aéroport" icon="plane"><input value="Lyon–Saint-Exupéry · LYS" readOnly /></Field></div>
            <div className="oq-place"><h2>ENVIE D’ALLER À</h2><div className="oq-two"><Field label="Pays" icon="chevron"><select defaultValue="Portugal"><option>Portugal</option></select></Field><Field label="Ville"><input value="Lisbonne" readOnly /></Field></div><Field label="Aéroport" icon="plane"><input value="Humberto Delgado · LIS" readOnly /></Field></div>
          </div>
          <div className="oq-details-grid">
            <Field label="Date de départ" icon="calendar"><input type="date" required value={departureDate} onChange={e => setDepartureDate(e.target.value)} /></Field>
            <Field label="Date de retour" icon="calendar"><input type="date" required={roundTrip} disabled={!roundTrip} min={departureDate} value={returnDate} onChange={e => setReturnDate(e.target.value)} /></Field>
            <Field label="Passagers" icon="user"><select value={passagers} onChange={e => setPassagers(Number(e.target.value))}><option value="1">1 adulte</option><option value="2">2 adultes</option><option value="3">3 adultes</option></select></Field>
            <Field label={`Budget maximum ${roundTrip ? "A/R" : ""}`} icon="wallet"><input type="number" min="1" required value={budget} onChange={e => setBudget(e.target.value)} aria-label="Budget maximum"/><select aria-label="Devise du budget" value={devise} onChange={e => setDevise(e.target.value)}><option value="EUR">EUR</option><option value="USD">USD</option></select></Field>
          </div>
          <div className="oq-form-bottom"><div className="oq-preferences">{direct && <span>Direct privilégié</span>}{bagageRequis && <span>Bagage en soute</span>}<button type="button" onClick={() => setModal("Mes préférences")}>Modifier mes préférences</button></div><button className="oq-primary" type="submit" disabled={rechercheEnCours}>{rechercheEnCours ? "Recherche…" : "Trouver mes vols"} <Icon name="search" size={15}/></button></div>
        </form>

        {erreur && <aside className="oq-location-notice" role="alert"><Icon name="pin" size={17}/><div><strong>{erreur}</strong></div></aside>}
        <aside className="oq-location-notice" aria-live="polite"><Icon name="pin" size={17}/><div><strong>{locationNotice}</strong><p>Votre départ est renseigné manuellement : France → Lyon → LYS. Aucune position n’est nécessaire pour lancer la recherche.</p></div></aside>

        <section className="oq-results">
          <div className="oq-results-heading"><div><h2>{tab === "Mes favoris" ? "Vos envies prennent leur envol." : tab === "Historique" ? "Vos dernières recherches." : tab === "Comparateur" ? "Comparez vos prochains horizons." : "Les vols disponibles"}</h2><p>{tab === "Historique" ? `${history.length} recherche(s) enregistrée(s)` : `${shown.length} vol(s) du catalogue · prix affichés dans la devise enregistrée`}</p></div><button className="oq-text-link" onClick={() => setTab("Historique")}>Retrouver mon historique <Icon name="arrow" size={12}/></button></div>
          {tab === "Historique" ? (chargement ? <div className="oq-empty">Chargement de votre historique…</div> : history.length ? <div className="oq-history-list">{history.map(recherche => <div className="oq-empty" key={recherche.id}><span>{recherche.ville_origine ?? recherche.origine ?? "Départ"} → {recherche.ville_destination ?? recherche.destination ?? "Destination"} · {dateLabel(recherche.date_depart)}{recherche.aller_retour && ` au ${dateLabel(recherche.date_retour)}`} · {recherche.nb_passagers} passager(s)</span><button className="oq-outline" onClick={() => { if (recherche.date_depart) setDepartureDate(recherche.date_depart); setRoundTrip(recherche.aller_retour); if (recherche.date_retour) setReturnDate(recherche.date_retour); setTab("Explorer"); }}>Reprendre</button></div>)}</div> : <div className="oq-empty">Aucune recherche enregistrée pour le moment.</div>) : <div className="oq-flight-grid">{shown.map(flight => <article className="oq-flight" key={flight.id}>
            <div className="oq-flight-head"><span className="oq-airline-icon">{flight.compagnie_aller.slice(0, 2).toUpperCase()}</span><span>{flight.compagnie_aller}</span><button disabled={favorisEnCours.includes(flight.id)} aria-label={`${flight.favori ? "Retirer" : "Ajouter"} ${flight.compagnie_aller} ${flight.favori ? "des" : "aux"} favoris`} aria-pressed={flight.favori} className={flight.favori ? "is-favorite" : ""} onClick={() => void toggleFavorite(flight)}><Icon name="heart" size={18} filled={flight.favori}/></button></div>
            <div className="oq-flight-route"><div><strong>{flight.heure_depart ?? "--:--"}</strong><small>{flight.origine} · {flight.ville_origine ?? "Départ"}</small></div><div className="oq-route-center"><span>{formaterDuree(flight.duree_aller_min)}</span><div className="oq-route-line"><i/><b/><Icon name="plane" size={14}/></div><small>{flight.escales_aller === 0 ? "Direct" : `${flight.escales_aller} escale(s)`}</small></div><div className="oq-arrival"><strong>{flight.heure_arrivee ?? "--:--"}</strong><small>{flight.destination} · {flight.ville_destination ?? "Arrivée"}</small></div></div>
            <div className="oq-flight-meta"><span>{flight.bagage_inclus === null ? "Bagage non renseigné" : flight.bagage_inclus ? "Bagage en soute inclus" : "Bagage non inclus"}</span><span>{dateLabel(flight.date_depart)}{flight.date_retour ? ` – ${dateLabel(flight.date_retour)}` : ""}</span></div>
            <div className="oq-flight-note"><Icon name="sparkles" size={15}/><span>{flight.simulee ? "Itinéraire simulé présent dans le catalogue." : "Vol présent dans le catalogue de la base."}</span></div>
            <div className="oq-flight-footer"><div><strong>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: flight.devise.trim() }).format(flight.prix)}</strong><small>{flight.aller_retour ? "A/R" : "Aller simple"}</small></div><button className="oq-outline" onClick={() => setModal(`Vol ${flight.compagnie_aller}`)}>Détails <Icon name="arrow" size={15}/></button></div>
          </article>)}</div>}
          {tab !== "Historique" && shown.length === 0 && <div className="oq-empty">{chargement ? "Chargement de vos données…" : tab === "Mes favoris" ? "Vous n’avez pas encore de vol favori." : rechercheEnCours ? "Recherche des vols dans le catalogue…" : flights.length === 0 ? "Lancez une recherche pour consulter les vols enregistrés dans la base." : "Aucun vol ne correspond à ces critères."}</div>}
        </section>

        <aside className="oq-profile-banner"><Icon name="sparkles" size={28}/><div><h2>Vos choix donnent le cap.</h2><p>{favorites.length} vol(s) favori(s) et {history.length} recherche(s) sont associés à votre compte.</p></div><button className="oq-outline" onClick={() => setModal("Mon profil")}>Gérer mon profil</button></aside>
        <footer className="oq-footer"><span>Les Orques tactiques · SAÉ BUT3 S.Real.01 · v0.1.0</span><div><button onClick={() => setModal("Confidentialité")}>Confidentialité</button><button onClick={() => setModal("Conditions d’utilisation")}>Conditions d’utilisation</button></div></footer>
      </main>

      {modal && <div className="oq-overlay" onClick={() => setModal(null)}><section className="oq-modal" role="dialog" aria-modal="true" aria-label={modal} onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Escape") setModal(null); }}><button autoFocus className="oq-close" aria-label="Fermer" onClick={() => setModal(null)}>×</button><h2>{modal}</h2>{modal === "Mes préférences" ? <><label><input type="checkbox" checked={direct} onChange={e => setDirect(e.target.checked)}/> Privilégier les vols directs</label><label><input type="checkbox" checked={bagageRequis} onChange={e => setBagageRequis(e.target.checked)}/> Exiger un bagage en soute</label><p>Ces critères filtrent les vols lorsque vous lancez une recherche.</p></> : modal === "Mon profil" ? <><p>{nomAffiche} · {favorites.length} vol(s) favori(s). Vos favoris et recherches sont enregistrés avec votre compte.</p><div className="oq-account-actions"><button type="button" className="oq-primary" disabled={deconnexionEnCours} onClick={changerDeCompte}>{deconnexionEnCours ? "Déconnexion…" : "Se connecter à un autre compte"}</button><button type="button" className="oq-outline" disabled={deconnexionEnCours} onClick={changerDeCompte}>Se déconnecter</button></div></> : modal.startsWith("Vol ") ? <p>Ce vol est issu du catalogue de la base. La réservation n’est pas encore proposée depuis cette page.</p> : <p>Consultez les conditions et informations de confidentialité de votre compte auprès de l’équipe du projet.</p>}<button className="oq-primary oq-modal-close" onClick={() => setModal(null)}>Terminer</button></section></div>}
    </div>
  );
}

const styles = `
.orque-page{--ink:#163b49;--deep:#093f4a;--teal:#00858c;--soft:#e6f4f0;--muted:#748994;--line:#dce6e8;min-height:100vh;background:#f3f7f6;color:var(--ink);font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;-webkit-font-smoothing:antialiased}
.orque-page *{box-sizing:border-box}.orque-page button,.orque-page input,.orque-page select{font:inherit}.orque-page button{cursor:pointer}.orque-page button,.orque-page a,.orque-page input,.orque-page select{ -webkit-tap-highlight-color:transparent}.orque-page button:focus-visible,.orque-page a:focus-visible,.orque-page input:focus-visible,.orque-page select:focus-visible{outline:2px solid var(--teal);outline-offset:3px}.orque-page button{border:0;background:none;color:inherit}.orque-page svg{flex-shrink:0}.orque-page h1,.orque-page h2,.orque-page p{margin:0}.oq-header{background:#fff;border-top:8px solid #f6f6f6}.oq-topbar{height:82px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #cbdcde;padding:0 6px;gap:20px}.oq-brand{display:flex;gap:9px;align-items:center;color:var(--ink);text-decoration:none}.oq-mark{width:38px;height:38px;background:var(--deep);border-radius:12px;display:flex}.oq-mark svg{width:100%;height:100%}.oq-wordmark{font-size:27px;line-height:1}.oq-wordmark small{display:block;font-size:7px;letter-spacing:1.8px;color:var(--muted);margin-top:5px}.oq-nav{align-self:stretch;display:flex;gap:29px}.oq-nav button{position:relative;padding:0;font-size:12px;color:#5f7882}.oq-nav button.active{color:var(--teal)}.oq-nav button.active:after{content:'';position:absolute;height:2px;bottom:0;background:var(--teal);left:0;right:0}.oq-account{display:flex;gap:11px;align-items:center}.oq-demo{background:var(--soft);padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700}.oq-avatar{width:32px;height:32px;border-radius:50%;background:var(--deep);color:white;display:grid;place-items:center;font-size:11px}.oq-account button{display:flex;gap:12px;align-items:center;font-weight:600;padding:0}.oq-account svg{color:var(--teal)}.oq-subbar{min-height:62px;display:flex;justify-content:space-between;align-items:center;gap:15px;padding:10px 6px;color:var(--muted);font-size:9px}.oq-subbar>div{display:flex;gap:25px}.oq-subbar button{padding:0;color:var(--teal);font-size:9px}.oq-main{max-width:1440px;margin:auto;padding:31px 6px 0}.oq-hero{display:grid;grid-template-columns:61.8% 38.2%;min-height:211px;border-radius:22px;overflow:hidden;background:var(--deep);color:white}.oq-hero-copy{padding:32px}.oq-eyebrow{display:inline-block;background:#ddf78c;color:var(--deep);font-size:10px;font-weight:bold;padding:5px 10px;border-radius:20px}.oq-hero h1{font-size:37px;line-height:1.2;letter-spacing:-1.4px;font-weight:600;margin:17px 0 13px;white-space:nowrap}.oq-hero p{font-size:15px;color:#c0d9dc;letter-spacing:.15px}.oq-photo{background:linear-gradient(0deg,rgba(0,30,40,.08),rgba(0,30,40,.08)),url('/images/lisbonne.jpg') center 54%/cover no-repeat;background-color:#92b6bd}.oq-search-panel{margin-top:28px;padding:24px;border:1px solid var(--line);border-radius:16px;background:#fff}.oq-form-top,.oq-form-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px}.oq-trip{display:flex;gap:8px}.oq-trip button{background:var(--soft);border-radius:20px;font-size:10px;font-weight:600;padding:5px 10px}.oq-trip button.selected{background:var(--deep);color:#fff}.oq-location{display:flex;align-items:center;gap:7px;color:var(--teal)!important;font-size:10px!important;font-weight:600!important;padding:0}.oq-journey-grid{display:grid;grid-template-columns:1fr 1fr;gap:21px;margin-top:20px}.oq-place h2{font-size:10px;letter-spacing:1.5px;color:var(--teal);font-weight:600;margin-bottom:7px}.oq-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.oq-field{display:block;min-width:0}.oq-field>span{display:block;font-size:10px;font-weight:600;margin-bottom:5px}.oq-input{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:9px;min-height:45px;padding:0 12px;background:white}.oq-input>svg{color:var(--teal)}.oq-input input,.oq-input select{border:0;outline:none;background:transparent;color:var(--ink);width:100%;min-width:0;padding:10px 0;appearance:none;font-size:12px}.oq-input input[type=number]{appearance:textfield;width:38px}.oq-input input::-webkit-inner-spin-button{appearance:none}.oq-euro{margin-left:-5px}.oq-input input[type=date]::-webkit-calendar-picker-indicator{opacity:0;width:12px;cursor:pointer}.oq-input:focus-within{border-color:var(--teal)}.oq-input input:disabled{opacity:.35}.oq-place>.oq-field{margin-top:10px}.oq-details-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px}.oq-form-bottom{margin-top:21px}.oq-preferences{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.oq-preferences>span{background:var(--soft);border-radius:20px;padding:4px 9px;font-size:10px;font-weight:600}.oq-preferences button{font-size:10px;color:var(--teal);padding:0}.oq-primary{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:8px;background:var(--teal)!important;color:white!important;padding:12px 16px;white-space:nowrap}.oq-location-notice{display:flex;align-items:flex-start;gap:12px;margin-top:28px;padding:14px 15px;background:var(--soft);border-radius:8px}.oq-location-notice>svg{color:var(--teal);margin-top:1px}.oq-location-notice strong{font-size:12px;font-weight:400}.oq-location-notice p{font-size:11px;color:var(--muted);margin-top:3px}.oq-results{margin-top:27px}.oq-results-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:17px}.oq-results-heading h2{font-size:24px;letter-spacing:-.7px;font-weight:600}.oq-results-heading p{font-size:12px;color:var(--muted);margin-top:3px}.oq-text-link{display:flex;align-items:center;gap:3px;color:var(--teal)!important;font-size:11px!important;white-space:nowrap;padding:0 0 2px}.oq-flight-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.oq-flight{background:white;border:1px solid var(--line);border-radius:16px;padding:18px}.oq-flight-head{display:flex;gap:10px;align-items:center;font-size:11px}.oq-airline-icon{display:grid;place-items:center;width:29px;height:29px;border-radius:7px;background:var(--soft);color:var(--teal);font-size:10px}.oq-flight-head button{margin-left:auto;color:#6a8490;padding:0;display:flex}.oq-flight-head button.is-favorite{color:var(--teal)}.oq-flight-route{display:flex;align-items:center;gap:9px;margin-top:18px}.oq-flight-route strong{display:block;font-size:23px;line-height:1.2;font-weight:600;letter-spacing:-.4px}.oq-flight-route small{display:block;color:var(--muted);font-size:10px;margin-top:4px;white-space:nowrap}.oq-arrival{text-align:right}.oq-route-center{flex:1;min-width:30px;text-align:center;align-self:stretch}.oq-route-center>span{font-size:10px;color:var(--muted);display:block;margin-top:-3px}.oq-route-line{display:flex;align-items:center;gap:3px;color:var(--teal);margin:5px 0}.oq-route-line i{width:4px;height:4px;border-radius:50%;background:var(--teal)}.oq-route-line b{height:1px;background:#dbe8e8;flex:1}.oq-route-center small{color:var(--teal);font-size:9px;margin:0}.oq-flight-meta{display:flex;justify-content:space-between;gap:6px;margin-top:17px;color:var(--muted);font-size:10px}.oq-flight-meta span:last-child{font-size:9px}.oq-flight-note{display:flex;align-items:flex-start;gap:9px;min-height:55px;background:var(--soft);border-radius:6px;padding:10px 11px;margin-top:13px;font-size:11px;line-height:1.5}.oq-flight-note svg{color:var(--teal);margin-top:2px}.oq-flight-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:15px}.oq-flight-footer strong{font-weight:400;font-size:24px;white-space:nowrap}.oq-flight-footer small{font-size:9px;color:var(--muted);margin-left:7px}.oq-outline{border:1px solid var(--line)!important;border-radius:9px;background:white!important;color:var(--teal)!important;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:11px 15px;font-size:12px;white-space:nowrap}.oq-profile-banner{display:flex;align-items:center;gap:26px;background:var(--soft);border-radius:16px 16px 0 0;margin-top:28px;padding:23px}.oq-profile-banner>svg{color:var(--teal)}.oq-profile-banner>div{flex:1}.oq-profile-banner h2{font-size:16px;font-weight:400}.oq-profile-banner p{color:var(--muted);font-size:11px;margin-top:5px}.oq-empty{padding:24px;background:white;border:1px solid var(--line);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}.oq-overlay{position:fixed;inset:0;background:#062e3a80;z-index:100;display:grid;place-items:center;padding:20px}.oq-modal{position:relative;width:100%;max-width:440px;background:white;border-radius:18px;padding:30px;box-shadow:0 20px 80px #002c3a30}.oq-modal h2{font-size:23px;margin-bottom:20px}.oq-modal p{font-size:14px;margin-bottom:24px;line-height:1.7}.oq-modal label{display:flex;gap:10px;align-items:center;margin:16px 0;font-size:14px}.oq-modal input{accent-color:var(--teal)}.oq-modal .oq-close{position:absolute;right:12px;top:8px;font-size:28px}.oq-modal>.oq-primary{margin-top:8px}
.oq-footer{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 2px;color:var(--muted);font-size:9px}.oq-footer>div{display:flex;gap:25px}.oq-footer button{padding:0;color:var(--teal);font-size:9px}
.oq-account-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}.oq-account-actions button{min-height:42px}.oq-account-actions button:disabled{opacity:.55;cursor:wait}.oq-modal-close{margin-top:0}
@media(min-width:1450px){.oq-topbar,.oq-subbar{padding-left:max(24px,calc((100vw - 1428px)/2));padding-right:max(24px,calc((100vw - 1428px)/2))}}
/* La capture mesure environ 750px de large : ces valeurs reproduisent sa densité. */
@media(min-width:701px) and (max-width:1000px){.orque-page{font-size:8px}.oq-header{border-top-width:7px}.oq-topbar{height:51px;padding:0 4px;gap:12px}.oq-mark{width:24px;height:24px;border-radius:8px}.oq-brand{gap:6px}.oq-wordmark{font-size:18px}.oq-wordmark small{font-size:4.5px;letter-spacing:1px;margin-top:3px}.oq-nav{gap:20px}.oq-nav button{font-size:8px}.oq-account{gap:7px}.oq-demo{font-size:7px;padding:3px 7px}.oq-avatar{width:21px;height:21px;font-size:7px}.oq-account button{gap:8px;font-size:8px}.oq-subbar{min-height:39px;padding:7px 4px;font-size:6px;gap:8px}.oq-subbar>div{gap:17px}.oq-subbar button{font-size:6px}.oq-main{padding:20px 4px 0}.oq-hero{min-height:134px;border-radius:14px}.oq-hero-copy{padding:20px}.oq-eyebrow{font-size:6.5px;padding:3px 6px}.oq-hero h1{font-size:24px;letter-spacing:-.8px;margin:10px 0 8px}.oq-hero p{font-size:9.5px}.oq-search-panel{margin-top:18px;padding:15px;border-radius:10px}.oq-trip{gap:5px}.oq-trip button{font-size:6.5px;padding:3px 7px}.oq-location{font-size:6.5px!important;gap:5px}.oq-location svg{width:9px;height:9px}.oq-journey-grid{gap:13px;margin-top:13px}.oq-place h2{font-size:6.5px;letter-spacing:1px;margin-bottom:5px}.oq-two{gap:8px}.oq-field>span{font-size:7px;margin-bottom:3px}.oq-input{min-height:29px;border-radius:6px;padding:0 8px;gap:5px}.oq-input input,.oq-input select{font-size:8px;padding:6px 0}.oq-input input[type=number]{width:25px}.oq-input>svg{width:10px;height:10px}.oq-place>.oq-field{margin-top:6px}.oq-details-grid{gap:9px;margin-top:13px}.oq-form-bottom{margin-top:14px}.oq-preferences{gap:6px}.oq-preferences>span{font-size:6.5px;padding:3px 6px}.oq-preferences button{font-size:6.5px}.oq-primary{padding:8px 10px;border-radius:6px;gap:6px}.oq-primary svg{width:10px;height:10px}.oq-location-notice{margin-top:18px;padding:9px 10px;gap:8px;border-radius:6px}.oq-location-notice>svg{width:11px;height:11px}.oq-location-notice strong{font-size:8px}.oq-location-notice p{font-size:7px;margin-top:2px}.oq-results{margin-top:17px}.oq-results-heading{margin-bottom:11px}.oq-results-heading h2{font-size:16px;letter-spacing:-.4px}.oq-results-heading p{font-size:8px;margin-top:2px}.oq-text-link{font-size:7px!important}.oq-text-link svg{width:9px}.oq-flight-grid{gap:12px}.oq-flight{border-radius:11px;padding:12px}.oq-flight-head{font-size:7px;gap:6px}.oq-airline-icon{width:19px;height:19px;border-radius:5px;font-size:6px}.oq-flight-head button svg{width:12px;height:12px}.oq-flight-route{gap:6px;margin-top:12px}.oq-flight-route strong{font-size:15px;letter-spacing:-.2px}.oq-flight-route small{font-size:6.5px;margin-top:3px}.oq-route-center>span{font-size:6.5px;margin-top:-2px}.oq-route-line{gap:2px;margin:4px 0}.oq-route-line svg{width:9px;height:9px}.oq-route-line i{width:3px;height:3px}.oq-route-center small{font-size:6px;margin:0}.oq-flight-meta{margin-top:11px;font-size:6.5px}.oq-flight-meta span:last-child{font-size:6px}.oq-flight-note{gap:6px;min-height:35px;border-radius:4px;padding:6px 7px;margin-top:8px;font-size:7px}.oq-flight-note svg{width:10px;height:10px;margin-top:1px}.oq-flight-footer{margin-top:10px;gap:5px}.oq-flight-footer strong{font-size:16px}.oq-flight-footer small{font-size:6px;margin-left:5px}.oq-outline{border-radius:6px;gap:6px;padding:7px 10px;font-size:8px}.oq-outline svg{width:10px;height:10px}.oq-profile-banner{gap:17px;border-radius:11px 11px 0 0;margin-top:18px;padding:15px}.oq-profile-banner>svg{width:18px;height:18px}.oq-profile-banner h2{font-size:10px}.oq-profile-banner p{font-size:7px;margin-top:3px}}
@media(max-width:700px){.oq-header{border-top:0}.oq-topbar{height:auto;min-height:76px;flex-wrap:wrap;padding:14px 18px 0;gap:12px}.oq-brand{order:0}.oq-account{order:1;margin-left:auto}.oq-nav{order:2;width:100%;justify-content:space-between;gap:12px;height:42px}.oq-nav button{font-size:11px}.oq-subbar{padding:10px 18px;font-size:8px;flex-wrap:wrap;gap:6px}.oq-subbar>span:nth-child(2){display:none}.oq-subbar>div{gap:10px}.oq-subbar button{font-size:8px}.oq-main{padding:16px 12px 0}.oq-hero{grid-template-columns:1fr;position:relative;min-height:220px}.oq-hero-copy{position:relative;padding:25px;z-index:1;background:linear-gradient(90deg,#093f4af5,#093f4aa0)}.oq-hero h1{font-size:29px;white-space:normal;letter-spacing:-1px;max-width:350px}.oq-hero p{font-size:12px;max-width:280px}.oq-photo{position:absolute;inset:0;opacity:.65}.oq-search-panel{padding:17px;margin-top:16px}.oq-form-top{align-items:flex-start;gap:12px}.oq-location{max-width:135px;font-size:9px!important;text-align:left}.oq-journey-grid{grid-template-columns:1fr;gap:18px}.oq-details-grid{grid-template-columns:1fr 1fr;gap:12px}.oq-field>span{font-size:9px;min-height:14px}.oq-input{padding:0 9px}.oq-input input,.oq-input select{font-size:11px}.oq-form-bottom{flex-wrap:wrap}.oq-form-bottom>.oq-primary{width:100%}.oq-location-notice{margin-top:16px}.oq-location-notice strong{font-size:10px}.oq-location-notice p{font-size:10px}.oq-results-heading{align-items:flex-start;flex-direction:column}.oq-results-heading h2{font-size:23px}.oq-results-heading p{font-size:11px}.oq-flight-grid{grid-template-columns:1fr}.oq-flight{padding:20px}.oq-flight-route strong{font-size:26px}.oq-flight-note{min-height:0;font-size:12px}.oq-flight-meta{font-size:11px}.oq-flight-meta span:last-child{font-size:10px}.oq-flight-head{font-size:12px}.oq-profile-banner{padding:20px;gap:14px;flex-wrap:wrap;margin-top:20px}.oq-profile-banner>div{min-width:200px}.oq-profile-banner>.oq-outline{margin-left:42px}.oq-profile-banner p{font-size:10px}.oq-empty{flex-wrap:wrap}}
`;