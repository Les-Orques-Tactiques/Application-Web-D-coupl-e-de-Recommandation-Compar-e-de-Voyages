import { Link, useNavigate } from "react-router-dom";
import type { RechercheHistorique } from "@/features/explorer";
import { versParametres } from "@/features/explorer/utils/parametresRecherche";
import { Encart } from "@/features/explorer/components/Encart";
import {
  BandeauAfficherPlus,
  EnTeteHistorique,
  GroupeJour,
  criteresDepuisHistorique,
  grouperParJour,
  useHistorique,
} from "@/features/historique";

/**
 * Page « Historique » (/historique) : les recherches de l'utilisateur connecté.
 * La logique est dans useHistorique, l'affichage dans components/ :
 * cette page ne fait qu'assembler les morceaux.
 */
export default function PageHistorique() {
  const navigate = useNavigate();
  const historique = useHistorique();

  // Relance la recherche sur la page Résultats, comme dans PageMonCompte
  function relancer(r: RechercheHistorique) {
    const criteres = criteresDepuisHistorique(r);
    if (!criteres) {
      historique.setErreur("Cette recherche est incomplète, elle ne peut pas être relancée.");
      return;
    }
    navigate(`/resultats?${versParametres(criteres).toString()}`);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-16">
      <EnTeteHistorique
        chargement={historique.chargement}
        nbRecherches={historique.recherches.length}
        confirmerVidage={historique.confirmerVidage}
        onVider={() => void historique.vider()}
        onAnnulerVidage={historique.annulerVidage}
      />

      {historique.erreur && (
        <p role="alert" className="mt-6 rounded-lg bg-erreur-fond px-4 py-3 text-[13px] text-erreur">
          {historique.erreur}
        </p>
      )}

      <div className="mt-5">
        {historique.chargement ? (
          <Encart>Chargement de votre historique…</Encart>
        ) : historique.recherches.length === 0 ? (
          <Encart>
            Aucune recherche enregistrée pour le moment.{" "}
            <Link to="/explorer" className="font-medium text-principal hover:underline">
              Lancer une recherche
            </Link>
          </Encart>
        ) : (
          grouperParJour(historique.recherches).map((groupe) => (
            <GroupeJour
              key={groupe.cle}
              groupe={groupe}
              onSupprimer={(id) => void historique.supprimer(id)}
              onRelancer={relancer}
            />
          ))
        )}
      </div>

      {!historique.chargement && !historique.toutCharge && historique.recherches.length > 0 && (
        <BandeauAfficherPlus
          nbAffichees={historique.recherches.length}
          chargement={historique.chargementSuite}
          onAfficherPlus={() => void historique.afficherPlus()}
        />
      )}
    </section>
  );
}