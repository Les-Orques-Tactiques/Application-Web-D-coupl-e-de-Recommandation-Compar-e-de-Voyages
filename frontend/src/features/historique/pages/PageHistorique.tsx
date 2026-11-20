import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { ErreurApi } from "@/lib/clientApi";
import type { CriteresRecherche, RechercheHistorique } from "@/features/explorer";
import { lireHistorique, supprimerRecherche, viderHistorique } from "@/features/explorer/services/explorationApi";
import { versParametres } from "@/features/explorer/utils/parametresRecherche";
import { formaterDate, messageErreur } from "@/features/explorer/utils/formatage";
import { Encart } from "@/features/explorer/components/Encart";

const TAILLE_PAGE = 20; // nombre de recherches chargées à chaque fois
const BUDGET_SI_ABSENT = 1000; // même valeur que dans PageMonCompte

// ---------------------------------------------------------------------------
// Petites fonctions d'affichage
// ---------------------------------------------------------------------------

/** "2026-11-20T15:35:18+00:00" → "2026-11-20", à l'heure locale. Sert à regrouper par jour. */
function cleDuJour(iso: string | null): string {
  if (!iso) return "inconnu";
  const d = new Date(iso);
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mois}-${jour}`;
}

/** Titre d'un groupe : « Aujourd'hui », « Hier » ou la date. */
function libelleJour(cle: string): string {
  if (cle === "inconnu") return "Date inconnue";
  const maintenant = new Date();
  const hier = new Date();
  hier.setDate(maintenant.getDate() - 1);
  if (cle === cleDuJour(maintenant.toISOString())) return "Aujourd'hui";
  if (cle === cleDuJour(hier.toISOString())) return "Hier";
  return formaterDate(cle);
}

/** "2026-11-20T15:35:18+00:00" → "16:35" (heure locale). */
function heureDeRecherche(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Ligne de détail : dates, type de trajet, passagers, budget, escales. */
function resume(r: RechercheHistorique): string {
  const morceaux: string[] = [];
  if (r.date_depart) {
    morceaux.push(
      r.aller_retour && r.date_retour
        ? `${formaterDate(r.date_depart)} au ${formaterDate(r.date_retour)}`
        : formaterDate(r.date_depart),
    );
  }
  morceaux.push(r.aller_retour ? "aller-retour" : "aller simple");
  morceaux.push(`${r.nb_passagers} passager${r.nb_passagers > 1 ? "s" : ""}`);
  if (r.budget_max !== null) morceaux.push(`max ${r.budget_max} USD`);
  // autres_criteres est un objet libre (JSONB) : on vérifie le type avant de s'en servir
  const escales = r.autres_criteres.escales_max;
  if (escales === 0) morceaux.push("direct");
  else if (typeof escales === "number") morceaux.push(`${escales} escale${escales > 1 ? "s" : ""} max`);
  return morceaux.join(" · ");
}

/** Regroupe les recherches par jour, en gardant l'ordre (la plus récente d'abord). */
function grouperParJour(liste: RechercheHistorique[]) {
  const groupes: { cle: string; recherches: RechercheHistorique[] }[] = [];
  for (const r of liste) {
    const cle = cleDuJour(r.cree_le);
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.cle === cle) dernier.recherches.push(r);
    else groupes.push({ cle, recherches: [r] });
  }
  return groupes;
}

// ---------------------------------------------------------------------------
// La page
// ---------------------------------------------------------------------------

/**
 * Page « Historique » (/historique) : les recherches de l'utilisateur connecté.
 * En-tête comme PageMonCompte, cartes comme l'ancien onglet d'Explorer (ListeHistorique),
 * avec en plus : regroupement par jour, suppression, vidage et « Afficher plus ».
 */
export default function PageHistorique() {
  const navigate = useNavigate();
  const [recherches, setRecherches] = useState<RechercheHistorique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [toutCharge, setToutCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmerVidage, setConfirmerVidage] = useState(false);

  // Premier chargement, une seule fois à l'ouverture de la page
  useEffect(() => {
    let actif = true; // évite de modifier l'état si on a quitté la page entre-temps
    lireHistorique(TAILLE_PAGE, 0)
      .then((liste) => {
        if (!actif) return;
        setRecherches(liste);
        setToutCharge(liste.length < TAILLE_PAGE); // moins de 20 : il n'y a rien après
      })
      .catch((e) => {
        if (actif) setErreur(messageErreur(e));
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => {
      actif = false;
    };
  }, []);

  // « Afficher plus » : on demande les 20 suivantes en sautant celles déjà affichées
  async function afficherPlus() {
    setChargementSuite(true);
    setErreur("");
    try {
      const suite = await lireHistorique(TAILLE_PAGE, recherches.length);
      setRecherches((precedentes) => [...precedentes, ...suite]);
      setToutCharge(suite.length < TAILLE_PAGE);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargementSuite(false);
    }
  }

  // Supprime une recherche côté back, puis la retire de la liste sans tout recharger
  async function supprimer(id: string) {
    setErreur("");
    try {
      await supprimerRecherche(id);
      setRecherches((precedentes) => precedentes.filter((r) => r.id !== id));
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  // Premier clic : on demande confirmation. Deuxième clic : on vide.
  async function vider() {
    if (!confirmerVidage) {
      setConfirmerVidage(true);
      return;
    }
    setErreur("");
    try {
      await viderHistorique();
      setRecherches([]);
      setToutCharge(true);
    } catch (e) {
      // Le back limite cette route à 5 appels par minute
      setErreur(
        e instanceof ErreurApi && e.statut === 429
          ? "Trop de tentatives. Patientez une minute avant de réessayer."
          : messageErreur(e),
      );
    } finally {
      setConfirmerVidage(false);
    }
  }

  // Relance la recherche sur la page Résultats, comme dans PageMonCompte
  function relancer(r: RechercheHistorique) {
    if (!r.origine || !r.destination || !r.date_depart) {
      setErreur("Cette recherche est incomplète, elle ne peut pas être relancée.");
      return;
    }
    const criteres: CriteresRecherche = {
      origine: r.origine,
      destination: r.destination,
      date_depart: r.date_depart,
      date_retour: r.date_retour,
      aller_retour: r.aller_retour,
      nb_passagers: r.nb_passagers,
      budget_max: r.budget_max ?? BUDGET_SI_ABSENT,
      direct_seulement: r.autres_criteres.escales_max === 0,
    };
    navigate(`/resultats?${versParametres(criteres).toString()}`);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      {/* En-tête de page, même hiérarchie que PageMonCompte */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-principal">VOS RECHERCHES</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-encre">Historique</h1>
          <p className="mt-1 text-[13px] text-attenue">
            {chargement ? "Chargement…" : `${recherches.length} recherche(s) affichée(s)`}
          </p>
        </div>
        {recherches.length > 0 && (
          <button
            type="button"
            onClick={() => void vider()}
            onBlur={() => setConfirmerVidage(false)} // on annule la confirmation si on clique ailleurs
            className={`rounded-lg border px-4 py-2 text-[13px] font-medium ${
              confirmerVidage
                ? "border-erreur bg-erreur-fond text-erreur"
                : "border-trait bg-white text-attenue hover:border-principal hover:text-principal"
            }`}
          >
            {confirmerVidage ? "Confirmer : tout supprimer" : "Vider l'historique"}
          </button>
        )}
      </div>

      {erreur && (
        <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {erreur}
        </p>
      )}

      <div className="mt-5">
        {chargement ? (
          <Encart>Chargement de votre historique…</Encart>
        ) : recherches.length === 0 ? (
          <Encart>
            Aucune recherche enregistrée pour le moment.{" "}
            <Link to="/explorer" className="font-medium text-principal hover:underline">
              Lancer une recherche
            </Link>
          </Encart>
        ) : (
          grouperParJour(recherches).map((groupe) => (
            <div key={groupe.cle} className="mt-8 first:mt-0">
              <h3 className="mb-3 text-[13px] font-medium text-attenue">{libelleJour(groupe.cle)}</h3>
              <ul className="space-y-3">
                {groupe.recherches.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-trait bg-white p-5 text-[13px] text-encre"
                  >
                    <div>
                      <p className={`text-[15px] font-medium ${r.relancable ? "text-encre" : "text-attenue"}`}>
                        {r.origine ?? "Départ"} → {r.ville_destination ?? r.destination ?? "Destination"}
                        {!r.relancable && (
                          <small className="ml-2 text-[11px] font-normal text-attenue">(aéroport supprimé)</small>
                        )}
                      </p>
                      <p className="mt-1 text-attenue">
                        {resume(r)}
                        {r.cree_le && ` · recherché à ${heureDeRecherche(r.cree_le)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void supprimer(r.id)}
                        className="rounded-lg px-3 py-2 text-attenue hover:text-erreur"
                      >
                        Supprimer
                      </button>
                      <Bouton taille="petite" disabled={!r.relancable} onClick={() => relancer(r)}>
                        Relancer <ArrowRight className="size-4" aria-hidden="true" />
                      </Bouton>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {!chargement && !toutCharge && recherches.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-menthe px-5 py-4 text-[13px] text-encre">
          <span>Vous voyez les {recherches.length} recherches les plus récentes.</span>
          <button
            type="button"
            onClick={() => void afficherPlus()}
            disabled={chargementSuite}
            className="rounded-lg border border-trait bg-white px-4 py-2 font-medium text-principal hover:border-principal disabled:opacity-60"
          >
            {chargementSuite ? "Chargement…" : "Afficher plus"}
          </button>
        </div>
      )}
    </section>
  );
}
