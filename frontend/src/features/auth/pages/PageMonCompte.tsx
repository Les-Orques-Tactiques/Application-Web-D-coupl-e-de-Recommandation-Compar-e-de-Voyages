import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Heart,
  History,
  LogOut,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/contexte/useAuth";
import {
  lireConsentements,
  modifierConsentement,
  modifierProfil,
  type ConsentementsCompte,
} from "@/features/auth/services/api";
import {
  definirFavori,
  lireFavoris,
  lireHistorique,
  type RechercheHistorique,
  type VolExplorer,
} from "@/features/auth/services/explorationApi";

interface PreferencesCompte {
  aeroport: string;
  budget: string;
  escales: number;
  bagage: string;
}

const PREFERENCES_PAR_DEFAUT: PreferencesCompte = {
  aeroport: "Lyon–Saint-Exupéry · LYS",
  budget: "220",
  escales: 0,
  bagage: "Cabine incluse",
};

const CONSENTEMENTS_PAR_DEFAUT: ConsentementsCompte = {
  politique: true,
  personnalisation: false,
  localisation: false,
};

function estPreferencesCompte(valeur: unknown): valeur is PreferencesCompte {
  if (typeof valeur !== "object" || valeur === null) return false;
  const preferences = valeur as Record<string, unknown>;
  return typeof preferences.aeroport === "string"
    && typeof preferences.budget === "string"
    && typeof preferences.escales === "number"
    && typeof preferences.bagage === "string";
}

function dateCourte(valeur: string | null): string {
  if (!valeur) return "Date inconnue";
  const date = new Date(valeur.includes("T") ? valeur : `${valeur}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "Date inconnue"
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formaterDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const minutesRestantes = minutes % 60;
  return heures ? `${heures} h ${minutesRestantes.toString().padStart(2, "0")}` : `${minutesRestantes} min`;
}

function messageErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.message : "Une erreur inattendue est survenue.";
}

function Switch({
  actif,
  desactive,
  onChange,
  label,
}: {
  actif: boolean;
  desactive: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      disabled={desactive}
      className={`mc-switch${actif ? " actif" : ""}`}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

export default function PageMonCompte() {
  const { utilisateur, setUtilisateur, deconnecter } = useAuth();
  const [prenom, setPrenom] = useState(utilisateur?.prenom ?? "");
  const [nom, setNom] = useState(utilisateur?.nom ?? "");
  const [profilEnCours, setProfilEnCours] = useState(false);
  const [profilMessage, setProfilMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(PREFERENCES_PAR_DEFAUT);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  const [consentements, setConsentements] = useState(CONSENTEMENTS_PAR_DEFAUT);
  const [consentementEnCours, setConsentementEnCours] = useState<string | null>(null);
  const [consentementMessage, setConsentementMessage] = useState<string | null>(null);
  const [favoris, setFavoris] = useState<VolExplorer[]>([]);
  const [historique, setHistorique] = useState<RechercheHistorique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreursDonnees, setErreursDonnees] = useState<string[]>([]);
  const [favoriEnCours, setFavoriEnCours] = useState<string | null>(null);
  const [historiqueMessage, setHistoriqueMessage] = useState<string | null>(null);
  const [confirmationSuppression, setConfirmationSuppression] = useState("");
  const [suppressionMessage, setSuppressionMessage] = useState<string | null>(null);
  const [deconnexionEnCours, setDeconnexionEnCours] = useState(false);
  const [profilOuvert, setProfilOuvert] = useState(false);

  useEffect(() => {
    setPrenom(utilisateur?.prenom ?? "");
    setNom(utilisateur?.nom ?? "");
  }, [utilisateur?.prenom, utilisateur?.nom]);

  useEffect(() => {
    if (!utilisateur) return;
    try {
      const valeurStockee = localStorage.getItem(`orca.preferences.${utilisateur.id}`);
      if (valeurStockee) {
        const valeurLue: unknown = JSON.parse(valeurStockee);
        if (estPreferencesCompte(valeurLue)) setPreferences(valeurLue);
        else setPreferencesMessage("Les préférences enregistrées sur cet appareil sont illisibles.");
      }
    } catch (erreur: unknown) {
      setPreferencesMessage(`Impossible de lire les préférences locales : ${messageErreur(erreur)}`);
    }
  }, [utilisateur?.id]);

  useEffect(() => {
    let actif = true;
    const chargerDonnees = async () => {
      const [favorisResultat, historiqueResultat, consentementsResultat] = await Promise.allSettled([
        lireFavoris(),
        lireHistorique(),
        lireConsentements(),
      ]);
      if (!actif) return;

      const erreurs: string[] = [];
      if (favorisResultat.status === "fulfilled") setFavoris(favorisResultat.value);
      else erreurs.push(`Favoris : ${messageErreur(favorisResultat.reason)}`);
      if (historiqueResultat.status === "fulfilled") setHistorique(historiqueResultat.value);
      else erreurs.push(`Historique : ${messageErreur(historiqueResultat.reason)}`);
      if (consentementsResultat.status === "fulfilled") setConsentements(consentementsResultat.value);
      else erreurs.push(`Consentements : ${messageErreur(consentementsResultat.reason)}`);

      setErreursDonnees(erreurs);
      setChargement(false);
    };
    void chargerDonnees();
    return () => {
      actif = false;
    };
  }, []);

  async function enregistrerProfil(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!utilisateur) return;
    setProfilEnCours(true);
    setProfilMessage(null);
    try {
      const utilisateurMisAJour = await modifierProfil({ prenom: prenom.trim(), nom: nom.trim() });
      setUtilisateur(utilisateurMisAJour);
      setProfilMessage("Votre profil a bien été enregistré.");
    } catch (erreur: unknown) {
      setProfilMessage(`Impossible d’enregistrer votre profil : ${messageErreur(erreur)}`);
    } finally {
      setProfilEnCours(false);
    }
  }

  async function changerConsentement(type: "personnalisation" | "localisation") {
    setConsentementEnCours(type);
    try {
      const nouveauxConsentements = await modifierConsentement(type, !consentements[type]);
      setConsentements(nouveauxConsentements);
      setConsentementMessage("Votre choix a bien été enregistré.");
      setErreursDonnees((erreurs) => erreurs.filter((erreur) => !erreur.startsWith("Consentements :")));
    } catch (erreur: unknown) {
      setErreursDonnees((erreurs) => [
        ...erreurs.filter((message) => !message.startsWith("Consentements :")),
        `Consentements : ${messageErreur(erreur)}`,
      ]);
    } finally {
      setConsentementEnCours(null);
    }
  }

  function enregistrerPreferences(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!utilisateur) return;
    try {
      localStorage.setItem(`orca.preferences.${utilisateur.id}`, JSON.stringify(preferences));
      setPreferencesMessage("Préférences enregistrées sur cet appareil.");
    } catch (erreur: unknown) {
      setPreferencesMessage(`Impossible d’enregistrer les préférences : ${messageErreur(erreur)}`);
    }
  }

  async function retirerFavori(vol: VolExplorer) {
    setFavoriEnCours(vol.id);
    try {
      await definirFavori(vol.id, false);
      setFavoris((elements) => elements.filter((element) => element.id !== vol.id));
    } catch (erreur: unknown) {
      setErreursDonnees((erreurs) => [...erreurs, `Favori : ${messageErreur(erreur)}`]);
    } finally {
      setFavoriEnCours(null);
    }
  }

  async function telechargerDonnees() {
    if (!utilisateur) return;
    const fichier = new Blob(
      [JSON.stringify({ profil: utilisateur, preferences, consentements, favoris, historique }, null, 2)],
      { type: "application/json" },
    );
    const adresse = URL.createObjectURL(fichier);
    const lien = document.createElement("a");
    lien.href = adresse;
    lien.download = "mes-donnees-orca.json";
    lien.click();
    URL.revokeObjectURL(adresse);
  }

  async function confirmerChoixConfidentialite() {
    try {
      setConsentements(await lireConsentements());
      setConsentementMessage("Vos choix de confidentialité sont enregistrés.");
      setErreursDonnees((erreurs) => erreurs.filter((erreur) => !erreur.startsWith("Consentements :")));
    } catch (erreur: unknown) {
      setErreursDonnees((erreurs) => [
        ...erreurs.filter((message) => !message.startsWith("Consentements :")),
        `Consentements : ${messageErreur(erreur)}`,
      ]);
    }
  }

  async function retirerConsentementsFacultatifs() {
    setConsentementEnCours("retrait");
    setConsentementMessage(null);
    try {
      await modifierConsentement("personnalisation", false);
      setConsentements(await modifierConsentement("localisation", false));
      setConsentementMessage("Vos consentements facultatifs ont été retirés.");
      setErreursDonnees((erreurs) => erreurs.filter((erreur) => !erreur.startsWith("Consentements :")));
    } catch (erreur: unknown) {
      setErreursDonnees((erreurs) => [
        ...erreurs.filter((message) => !message.startsWith("Consentements :")),
        `Consentements : ${messageErreur(erreur)}`,
      ]);
      try {
        setConsentements(await lireConsentements());
      } catch (erreurLecture: unknown) {
        setErreursDonnees((erreurs) => [
          ...erreurs,
          `Actualisation des consentements : ${messageErreur(erreurLecture)}`,
        ]);
      }
    } finally {
      setConsentementEnCours(null);
    }
  }

  async function seDeconnecter() {
    setDeconnexionEnCours(true);
    await deconnecter();
    window.location.assign("/connexion");
  }

  const initiales = `${utilisateur?.prenom[0] ?? ""}${utilisateur?.nom[0] ?? ""}`.toUpperCase() || "??";

  return (
    <div className="mon-compte">
      <style>{styles}</style>
      <header className="mc-header">
        <Link to="/explorer" className="mc-brand" aria-label="Orque, explorer les vols">
          <span className="mc-brand-mark"><svg viewBox="0 0 40 40" width="22" height="22" aria-hidden="true"><path fill="white" d="M6 29c7-4 12-11 17-23 1 9 0 15 8 22-7 5-17 7-25 1Z" /></svg></span>
          <span>orque<small>LES ORQUES TACTIQUES</small></span>
        </Link>
        <nav className="mc-top-nav" aria-label="Navigation principale">
          <Link to="/explorer">Explorer</Link>
          <a href="#favoris">Mes favoris</a>
          <a href="#historique">Historique</a>
          <Link to="/resultats">Comparateur</Link>
        </nav>
        <div className="mc-header-user">
          <button type="button" className="mc-header-trigger" aria-haspopup="dialog" onClick={() => setProfilOuvert(true)}>
            <span className="mc-avatar">{initiales}</span>
            <span>{utilisateur?.prenom ?? "Mon compte"}</span>
            <ChevronDown aria-hidden="true" size={13} />
          </button>
        </div>
      </header>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-identity">
            <span className="mc-avatar mc-avatar-large">{initiales}</span>
            <strong>{utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : "Voyageur"}</strong>
            <span className="mc-account-badge">Compte démo</span>
          </div>
          <nav aria-label="Navigation de mon compte" className="mc-side-nav">
            <a className="selected" href="#profil"><UserRound size={15} /> Profil</a>
            <a href="#preferences"><SlidersHorizontal size={15} /> Préférences</a>
            <a href="#favoris"><Heart size={15} /> Favoris <span>{favoris.length}</span></a>
            <a href="#historique"><History size={15} /> Historique <span>{historique.length}</span></a>
            <a href="#confidentialite"><ShieldCheck size={15} /> Confidentialité</a>
          </nav>
          <button type="button" className="mc-logout" disabled={deconnexionEnCours} onClick={() => void seDeconnecter()}>
            <LogOut size={14} /> {deconnexionEnCours ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </aside>

        <main className="mc-content">
          <div className="mc-heading">
            <span className="mc-eyebrow">VOTRE ESPACE, VOS CHOIX</span>
            <h1>Mon compte</h1>
            <p>Un profil qui évolue. Et des données qui restent sous votre contrôle.</p>
          </div>

          {erreursDonnees.length > 0 && (
            <div className="mc-error" role="alert">
              <CircleHelp size={15} />
              <div>{erreursDonnees.map((erreur) => <p key={erreur}>{erreur}</p>)}</div>
            </div>
          )}

          <div className="mc-top-cards">
            <section id="profil" className="mc-card">
              <h2>Mon profil</h2>
              <form onSubmit={enregistrerProfil}>
                <div className="mc-two-fields">
                  <label>Prénom<input value={prenom} required minLength={2} maxLength={100} onChange={(e) => setPrenom(e.target.value)} /></label>
                  <label>Nom<input value={nom} required minLength={2} maxLength={100} onChange={(e) => setNom(e.target.value)} /></label>
                </div>
                <label>Adresse e-mail<input value={utilisateur?.email ?? ""} readOnly /></label>
                <p className="mc-verified"><Check size={12} /> Adresse vérifiée</p>
                <button className="mc-primary" type="submit" disabled={profilEnCours}>
                  {profilEnCours ? "Enregistrement…" : "Enregistrer le profil"}
                </button>
                {profilMessage && <p className="mc-status" role="status">{profilMessage}</p>}
                <Link to="/mot-de-passe-oublie" className="mc-link">Modifier mon mot de passe →</Link>
              </form>
            </section>

            <section id="preferences" className="mc-card">
              <h2>Mes préférences</h2>
              <form onSubmit={enregistrerPreferences}>
                <label>Aéroport habituel
                  <input value={preferences.aeroport} onChange={(e) => setPreferences({ ...preferences, aeroport: e.target.value })} />
                </label>
                <div className="mc-two-fields">
                  <label>Budget A/R / pers.
                    <span className="mc-input-suffix"><input type="number" min="0" value={preferences.budget} onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })} /><span>€</span></span>
                  </label>
                  <label>Escales
                    <select value={preferences.escales} onChange={(e) => setPreferences({ ...preferences, escales: Number(e.target.value) })}>
                      <option value={0}>Direct privilégié</option>
                      <option value={1}>1 escale maximum</option>
                      <option value={2}>2 escales maximum</option>
                    </select>
                  </label>
                </div>
                <label>Bagage privilégié
                  <select value={preferences.bagage} onChange={(e) => setPreferences({ ...preferences, bagage: e.target.value })}>
                    <option>Cabine incluse</option>
                    <option>Soute incluse</option>
                    <option>Sans préférence</option>
                  </select>
                </label>
                <button className="mc-outline" type="submit"><Settings2 size={13} /> Enregistrer les préférences</button>
                {preferencesMessage && <p className="mc-status" role="status">{preferencesMessage}</p>}
              </form>
            </section>
          </div>

          <aside className="mc-info">
            <SlidersHorizontal size={16} />
            <div><strong>Profil actualisé · Vos actions affinent les recommandations</strong>
              <p>Le total TAP et vos avis actifs renforcent les vols directs avec cabine. Le clic vers la réservation est un signal plus fort ; il n’implique pas un achat. Ces choix aident à personnaliser les recommandations.</p>
            </div>
          </aside>

          <section id="favoris" className="mc-section">
            <div className="mc-section-heading"><h2>Mes favoris <span>/ {favoris.length}</span></h2><Link to="/explorer">Offres de démonstration</Link></div>
            {chargement ? <p className="mc-empty">Chargement de vos favoris…</p> : favoris.length === 0
              ? <p className="mc-empty">Vous n’avez pas encore de vol favori.</p>
              : <div className="mc-favorites">
                {favoris.slice(0, 4).map((vol) => (
                  <article className="mc-favorite" key={vol.id}>
                    <div className="mc-favorite-title">
                      <h3>{vol.ville_origine ?? vol.origine} → {vol.ville_destination ?? vol.destination}</h3>
                      <button type="button" aria-label="Retirer ce vol des favoris" disabled={favoriEnCours === vol.id} onClick={() => void retirerFavori(vol)}>
                        <Heart size={16} fill="currentColor" />
                      </button>
                    </div>
                    <p>{vol.compagnie_aller} · {vol.origine} → {vol.destination} · {formaterDuree(vol.duree_aller_min)}</p>
                    <p>{dateCourte(vol.date_depart)}{vol.date_retour ? ` – ${dateCourte(vol.date_retour)}` : ""} · {vol.escales_aller === 0 ? "Direct" : `${vol.escales_aller} escale(s)`}</p>
                    <div className="mc-favorite-bottom">
                      <strong>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: vol.devise.trim(), maximumFractionDigits: 0 }).format(vol.prix)}</strong>
                      <Link to="/explorer">Voir le vol <ArrowRight size={13} /></Link>
                    </div>
                  </article>
                ))}
              </div>}
          </section>

          <section id="historique" className="mc-card mc-history">
            <div className="mc-history-heading"><div><h2>Mon historique</h2><p>{historique.length} recherche(s) associée(s) à votre compte</p></div>
              <button type="button" onClick={() => setHistoriqueMessage("L’effacement de l’historique n’est pas encore disponible.")}>Effacer l’historique <Trash2 size={12} /></button>
            </div>
            {historiqueMessage && <p className="mc-status" role="status">{historiqueMessage}</p>}
            <div className="mc-table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Action</th><th>Vol ou recherche</th><th>Accès</th></tr></thead>
                <tbody>
                  {historique.slice(0, 6).map((recherche) => (
                    <tr key={recherche.id}>
                      <td>{dateCourte(recherche.cree_le)}</td>
                      <td>Recherche enregistrée</td>
                      <td>{recherche.ville_origine ?? recherche.origine ?? "Départ"} → {recherche.ville_destination ?? recherche.destination ?? "Destination"}</td>
                      <td><Link to="/explorer">Revoir <ArrowRight size={11} /></Link></td>
                    </tr>
                  ))}
                  {!chargement && historique.length === 0 && <tr><td colSpan={4}>Aucune recherche enregistrée pour le moment.</td></tr>}
                  {chargement && <tr><td colSpan={4}>Chargement de votre historique…</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="mc-history-note"><Clock3 size={11} /> Les recherches affichées ici correspondent à l’activité de votre compte.</p>
          </section>

          <section id="confidentialite" className="mc-card mc-privacy">
            <h2>Confidentialité et consentements</h2>
            <div className="mc-consent-row">
              <div><strong>Personnalisation à partir de mes actions</strong><p>Favoris, avis et clics enrichissent le profil. Désactivez pour retirer notre accord et cesser ces mises à jour.</p></div>
              <Switch
                label="Personnalisation à partir de mes actions"
                actif={consentements.personnalisation}
                desactive={chargement || consentementEnCours !== null}
                onChange={() => void changerConsentement("personnalisation")}
              />
            </div>
            <div className="mc-consent-row">
              <div><strong>Géolocalisation ponctuelle</strong><p>Autorisation retirée. Le pays, la ville et l’aéroport peuvent toujours être saisis manuellement.</p></div>
              <Switch
                label="Géolocalisation ponctuelle"
                actif={consentements.localisation}
                desactive={chargement || consentementEnCours !== null}
                onChange={() => void changerConsentement("localisation")}
              />
            </div>
            <p className="mc-privacy-note">Conditions d’utilisation et politique de confidentialité accessibles à l’inscription. Le consentement politique ne peut pas être retiré ici ; la suppression de compte n’est pas encore disponible dans cette version.</p>
            <div className="mc-privacy-actions">
              <button className="mc-primary" type="button" onClick={() => void confirmerChoixConfidentialite()}>Enregistrer mes choix</button>
              <button className="mc-outline" type="button" disabled={chargement} onClick={() => void telechargerDonnees()}>Exporter mes données <ArrowDownToLine size={13} /></button>
              <button className="mc-text-button" type="button" disabled={consentementEnCours !== null} onClick={() => void retirerConsentementsFacultatifs()}>Retrait possible à tout moment</button>
            </div>
            {consentementMessage && <p className="mc-status" role="status">{consentementMessage}</p>}
            <div className="mc-consent-confirmation"><ShieldCheck size={15} /><div><strong>{consentements.personnalisation ? "Personnalisation activée selon vos choix" : "Consentement de personnalisation retiré"}</strong><p>{consentements.personnalisation ? "Vos actions peuvent contribuer à adapter les recommandations. Vous pouvez retirer cet accord à tout moment." : "Votre profil n’est plus enrichi par vos actions. Vous conservez les recommandations basées sur vos critères de recherche et vos préférences explicites."}</p></div></div>
          </section>

          <section className="mc-delete">
            <div><span className="mc-eyebrow">POUR VOUS · CONFIRMATION DE SUPPRESSION</span><h2>Faire valoir mon droit à l’oubli.</h2>
              <p>La suppression définitive du compte et de ses données n’est pas encore disponible dans cette version.</p>
            </div>
            <div className="mc-delete-control">
              <label>Saisissez SUPPRIMER pour confirmer
                <input value={confirmationSuppression} onChange={(e) => setConfirmationSuppression(e.target.value)} placeholder="SUPPRIMER" />
              </label>
              <button type="button" disabled={confirmationSuppression !== "SUPPRIMER"} onClick={() => setSuppressionMessage("La suppression du compte n’est pas encore disponible depuis cette interface.")}>
                Supprimer mon compte et mes données
              </button>
              {suppressionMessage && <p role="status">{suppressionMessage}</p>}
              <small>Arrêt et suppression non disponibles dans cette version.</small>
            </div>
          </section>
          <footer className="mc-footer"><span>Les Orques tactiques · SAÉ BUT3 S.Real.01 · v0.1.0</span><Link to="/confidentialite">Confidentialité</Link></footer>
        </main>
      </div>
      {profilOuvert && (
        <div className="mc-profile-overlay" onClick={() => setProfilOuvert(false)}>
          <section
            className="mc-profile-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Mon profil"
            onClick={(evenement) => evenement.stopPropagation()}
            onKeyDown={(evenement) => { if (evenement.key === "Escape") setProfilOuvert(false); }}
          >
            <button autoFocus type="button" className="mc-profile-close" aria-label="Fermer" onClick={() => setProfilOuvert(false)}>×</button>
            <h2>Mon profil</h2>
            <p>{utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : "Mon compte"} · {favoris.length} vol(s) favori(s). Vos favoris et recherches sont enregistrés avec votre compte.</p>
            <div className="mc-profile-actions">
              <Link to="/mon-compte" className="mc-primary" onClick={() => setProfilOuvert(false)}>Ouvrir Mon compte</Link>
              <button type="button" className="mc-outline" disabled={deconnexionEnCours} onClick={() => void seDeconnecter()}>
                {deconnexionEnCours ? "Déconnexion…" : "Se connecter à un autre compte"}
              </button>
              <button type="button" className="mc-outline" disabled={deconnexionEnCours} onClick={() => void seDeconnecter()}>Se déconnecter</button>
            </div>
            <button type="button" className="mc-primary" onClick={() => setProfilOuvert(false)}>Terminer</button>
          </section>
        </div>
      )}
    </div>
  );
}

const styles = `
.mon-compte{--mc-ink:#163b49;--mc-deep:#093f4a;--mc-teal:#00858c;--mc-soft:#e6f4f0;--mc-muted:#748994;--mc-line:#dce6e8;min-height:100vh;background:#f3f7f6;color:var(--mc-ink);font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;-webkit-font-smoothing:antialiased}
.mon-compte *{box-sizing:border-box}.mon-compte button,.mon-compte input,.mon-compte select{font:inherit}.mon-compte button,.mon-compte a,.mon-compte input,.mon-compte select{ -webkit-tap-highlight-color:transparent}.mon-compte button:focus-visible,.mon-compte a:focus-visible,.mon-compte input:focus-visible,.mon-compte select:focus-visible{outline:2px solid var(--mc-teal);outline-offset:3px}.mon-compte button{cursor:pointer}.mon-compte h1,.mon-compte h2,.mon-compte h3,.mon-compte p{margin:0}.mc-header{height:61px;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 max(24px,calc((100vw - 1200px)/2));background:#fff;border-bottom:1px solid var(--mc-line)}.mc-brand{display:flex;align-items:center;gap:8px;color:var(--mc-ink);text-decoration:none;font-size:19px;line-height:1}.mc-brand small{display:block;color:var(--mc-muted);font-size:5px;letter-spacing:1.1px;margin-top:3px}.mc-brand-mark{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--mc-deep);color:#fff}.mc-top-nav{display:flex;align-self:stretch;align-items:center;gap:28px}.mc-top-nav a{color:var(--mc-muted);text-decoration:none;font-size:10px}.mc-top-nav a:hover,.mc-section-heading>a:hover{color:var(--mc-teal)}.mc-header-user{display:flex;align-items:center;gap:8px;color:var(--mc-ink);font-size:10px}.mc-demo{padding:3px 8px;border-radius:14px;background:var(--mc-soft);color:var(--mc-teal);font-size:8px;font-weight:700}.mc-avatar{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:var(--mc-deep);color:#fff;font-size:8px;font-weight:600}.mc-layout{display:grid;grid-template-columns:175px minmax(0,1fr);gap:30px;width:min(1140px,calc(100% - 48px));margin:0 auto;padding:30px 0 18px}.mc-sidebar{padding-top:2px}.mc-identity{display:flex;flex-direction:column;align-items:flex-start;padding:12px 12px 22px}.mc-avatar-large{width:39px;height:39px;font-size:10px;margin-bottom:8px}.mc-identity strong{font-size:11px;font-weight:500}.mc-account-badge{margin-top:5px;padding:3px 8px;border-radius:12px;background:var(--mc-soft);color:var(--mc-teal);font-size:8px}.mc-side-nav{display:grid;gap:3px}.mc-side-nav a{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:6px;color:var(--mc-muted);font-size:10px;text-decoration:none}.mc-side-nav a.selected,.mc-side-nav a:hover{background:var(--mc-soft);color:var(--mc-teal)}.mc-side-nav a span{margin-left:auto;font-size:9px}.mc-logout{display:flex;align-items:center;gap:7px;margin:12px 10px;color:var(--mc-teal);font-size:9px}.mc-logout:disabled{opacity:.55}.mc-content{min-width:0}.mc-heading{margin-bottom:20px}.mc-eyebrow{display:block;color:var(--mc-teal);font-size:8px;font-weight:700;letter-spacing:1.1px}.mc-heading h1{margin-top:3px;font-size:30px;font-weight:400;letter-spacing:-.7px}.mc-heading p{margin-top:3px;color:var(--mc-muted);font-size:11px}.mc-error{display:flex;gap:8px;margin-bottom:12px;padding:9px 12px;border-radius:6px;background:#fff0ef;color:#a52a23;font-size:10px}.mc-error svg{flex:none}.mc-error p+p{margin-top:3px}.mc-top-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}.mc-card{min-width:0;border:1px solid var(--mc-line);border-radius:11px;background:#fff;padding:15px}.mc-card h2{margin-bottom:11px;font-size:14px;font-weight:600}.mc-card form{display:grid;gap:8px}.mc-card label,.mc-delete-control label{display:grid;gap:4px;color:var(--mc-ink);font-size:8px;font-weight:600}.mc-card input,.mc-card select,.mc-delete-control input{width:100%;height:28px;border:1px solid #e1e9e9;border-radius:6px;background:#fff;padding:0 9px;color:var(--mc-ink);font-size:9px;font-weight:400;min-width:0}.mc-card input[readonly]{background:#fafcfc}.mc-two-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mc-input-suffix{position:relative;display:block}.mc-input-suffix input{padding-right:25px}.mc-input-suffix>span{position:absolute;right:9px;top:7px;color:var(--mc-muted);font-size:9px}.mc-verified{display:flex;align-items:center;gap:4px;color:var(--mc-teal);font-size:8px}.mc-primary,.mc-outline{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:29px;border-radius:6px;padding:0 10px;font-size:9px;text-decoration:none}.mc-primary{background:var(--mc-teal);color:white;border:1px solid var(--mc-teal)}.mc-primary:disabled{opacity:.6;cursor:wait}.mc-outline{border:1px solid var(--mc-line);background:#fff;color:var(--mc-teal)}.mc-link,.mc-text-button{width:max-content;padding:0;color:var(--mc-teal);font-size:8px;text-decoration:none}.mc-status{font-size:8px;color:var(--mc-teal)}.mc-info{display:flex;gap:9px;margin-top:11px;padding:10px;border-radius:6px;background:var(--mc-soft);color:var(--mc-ink)}.mc-info>svg{flex:none;color:var(--mc-teal)}.mc-info strong{display:block;font-size:8px;font-weight:500}.mc-info p{margin-top:3px;color:var(--mc-muted);font-size:7px}.mc-section{margin-top:15px}.mc-section-heading,.mc-history-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.mc-section-heading h2{font-size:14px;font-weight:600}.mc-section-heading h2 span{color:var(--mc-muted);font-weight:400}.mc-section-heading>a{color:var(--mc-muted);font-size:7px;text-decoration:none}.mc-favorites{display:grid;grid-template-columns:1fr 1fr;gap:10px}.mc-favorite{min-width:0;border:1px solid var(--mc-line);border-radius:10px;background:#fff;padding:12px}.mc-favorite-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.mc-favorite-title h3{font-size:12px;font-weight:600}.mc-favorite-title button{display:grid;place-items:center;color:var(--mc-teal);padding:0}.mc-favorite-title button:disabled{opacity:.5}.mc-favorite>p{margin-top:5px;color:var(--mc-muted);font-size:8px}.mc-favorite-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:9px}.mc-favorite-bottom strong{font-size:16px;font-weight:500}.mc-favorite-bottom a,.mc-history td a{display:flex;align-items:center;gap:4px;color:var(--mc-teal);font-size:8px;text-decoration:none}.mc-empty{border:1px solid var(--mc-line);border-radius:9px;background:#fff;padding:16px;color:var(--mc-muted);font-size:9px}.mc-history{margin-top:12px;padding:13px}.mc-history-heading{margin-bottom:10px}.mc-history-heading h2{margin:0 0 2px;font-size:14px}.mc-history-heading p{color:var(--mc-muted);font-size:8px}.mc-history-heading button{display:flex;align-items:center;gap:4px;padding:0;color:var(--mc-teal);font-size:8px}.mc-table-wrap{overflow-x:auto}.mc-history table{width:100%;border-collapse:collapse;white-space:nowrap}.mc-history th{padding:6px 7px;background:#f2f6f5;color:var(--mc-muted);font-size:7px;font-weight:500;text-align:left;text-transform:uppercase}.mc-history td{padding:7px;border-bottom:1px solid #edf1f0;font-size:8px}.mc-history td:first-child{color:var(--mc-muted)}.mc-history td[colspan]{color:var(--mc-muted);text-align:center}.mc-history-note{display:flex;align-items:center;gap:5px;margin-top:8px;color:var(--mc-muted);font-size:7px}.mc-privacy{margin-top:12px}.mc-privacy h2{margin-bottom:11px}.mc-consent-row{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:9px}.mc-consent-row strong{font-size:8px;font-weight:600}.mc-consent-row p,.mc-privacy-note{margin-top:3px;color:var(--mc-muted);font-size:7px}.mc-switch{position:relative;flex:none;width:29px;height:15px;border-radius:10px;background:#bdcbca;padding:2px;transition:background .15s}.mc-switch span{display:block;width:11px;height:11px;border-radius:50%;background:#fff;transition:transform .15s}.mc-switch.actif{background:var(--mc-teal)}.mc-switch.actif span{transform:translateX(14px)}.mc-switch:disabled{opacity:.6;cursor:wait}.mc-privacy-note{margin-top:12px}.mc-privacy-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:11px}.mc-text-button{margin-left:auto}.mc-consent-confirmation{display:flex;gap:8px;margin-top:10px;padding:9px;border-radius:6px;background:var(--mc-soft);color:var(--mc-ink)}.mc-consent-confirmation>svg{flex:none;color:var(--mc-teal)}.mc-consent-confirmation strong{font-size:8px;font-weight:600}.mc-consent-confirmation p{margin-top:2px;color:var(--mc-muted);font-size:7px}.mc-delete{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px;padding:14px;border-radius:10px;background:#fff0ef}.mc-delete .mc-eyebrow{color:#bb4b48;font-size:6px}.mc-delete h2{margin-top:6px;font-size:13px;font-weight:600}.mc-delete>div>p{margin-top:6px;color:var(--mc-muted);font-size:8px}.mc-delete-control{display:grid;align-content:center;gap:7px}.mc-delete-control label{font-size:7px}.mc-delete-control input{height:25px;background:#fff}.mc-delete-control button{min-height:28px;border-radius:6px;background:#b42318;color:#fff;font-size:8px}.mc-delete-control button:disabled{opacity:.55;cursor:not-allowed}.mc-delete-control p,.mc-delete-control small{color:#914744;font-size:7px}.mc-delete-control small{text-align:right}.mc-footer{display:flex;justify-content:space-between;gap:12px;padding:13px 0;color:var(--mc-muted);font-size:7px}.mc-footer a{color:var(--mc-teal);text-decoration:none}
.mc-header-trigger{display:flex;align-items:center;gap:8px;padding:0;border:0;background:transparent;color:var(--mc-ink);font-size:10px}.mc-profile-overlay{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:#062e3a80}.mc-profile-dialog{position:relative;width:min(440px,100%);border-radius:16px;background:#fff;padding:28px;box-shadow:0 20px 80px #002c3a30}.mc-profile-dialog h2{margin-bottom:14px;font-size:21px}.mc-profile-dialog p{margin-bottom:18px;font-size:12px;line-height:1.6}.mc-profile-close{position:absolute;top:8px;right:13px;border:0;background:transparent;color:var(--mc-muted);font-size:26px}.mc-profile-actions{display:grid;gap:8px;margin-bottom:16px}.mc-profile-actions .mc-primary,.mc-profile-actions .mc-outline{min-height:36px;font-size:10px}
@media(max-width:850px){.mc-header{padding:0 18px}.mc-layout{grid-template-columns:145px minmax(0,1fr);gap:18px;width:calc(100% - 36px)}.mc-top-nav{gap:14px}}
@media(max-width:640px){.mc-header{height:auto;min-height:58px;flex-wrap:wrap;padding:10px 14px;gap:10px}.mc-brand{font-size:16px}.mc-top-nav{order:3;width:100%;height:31px;justify-content:space-between;gap:8px}.mc-top-nav a{font-size:9px}.mc-header-user{margin-left:auto}.mc-demo{display:none}.mc-layout{display:block;width:calc(100% - 28px);padding-top:19px}.mc-sidebar{margin-bottom:16px}.mc-identity{display:none}.mc-side-nav{display:flex;overflow-x:auto;gap:4px}.mc-side-nav a{flex:none;padding:8px;font-size:9px}.mc-side-nav a span{margin-left:0}.mc-logout{margin:7px 4px}.mc-heading h1{font-size:27px}.mc-top-cards,.mc-favorites,.mc-delete{grid-template-columns:1fr}.mc-top-cards{gap:10px}.mc-card{padding:13px}.mc-privacy-actions{align-items:flex-start}.mc-text-button{margin-left:0}.mc-delete{gap:10px}.mc-footer{flex-wrap:wrap}}
`;
