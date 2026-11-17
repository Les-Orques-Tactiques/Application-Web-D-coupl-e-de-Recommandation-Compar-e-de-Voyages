import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Bandeau } from "@/components/ui/Bandeau";
import { Bouton, classeBouton } from "@/components/ui/Bouton";
import { Champ } from "@/components/ui/Champ";
import { renvoyerEmailActivation } from "../api";
import type { StatutActivation } from "../types";

// États du bouton "Renvoyer l'e-mail" : repos, envoi en cours, e-mail envoyé, échec
type EtatRenvoi = "repos" | "envoi" | "envoye" | "erreur";

interface PropsCarteActivation {
  statut: StatutActivation;
  email: string; // adresse connue (après inscription) ; vide si on arrive depuis le lien du mail
}

// Titre de la carte pour chaque statut. Record<A, B> = un objet dont les clés sont les valeurs de A.
// TypeScript vérifie ainsi qu'aucun statut n'est oublié.
const TITRES: Record<StatutActivation, string> = {
  en_attente: "Un e-mail vous attend",
  chargement: "Activation en cours…",
  succes: "Compte activé",
  expire: "Un e-mail vous attend",
  invalide: "Un e-mail vous attend",
};

/**
 * Carte de la page d'activation. Son contenu change selon le statut :
 * en attente du clic, activation en cours, succès, lien expiré ou lien invalide.
 * Elle permet aussi de renvoyer l'e-mail d'activation.
 */
export function CarteActivation({ statut, email }: PropsCarteActivation) {
  const [emailSaisi, setEmailSaisi] = useState(email); // utilisé quand on ne connaît pas l'adresse
  const [etatRenvoi, setEtatRenvoi] = useState<EtatRenvoi>("repos");
  // L'adresse à laquelle renvoyer : celle connue, sinon celle que la personne a saisie
  const adresseDestinataire = email || emailSaisi.trim();
  // Le renvoi n'a de sens que tant que le compte n'est pas activé
  const peutRenvoyer = statut === "en_attente" || statut === "expire" || statut === "invalide";

  /**
   * Demande l'envoi d'un nouvel e-mail d'activation.
   * Étapes : vérifier l'adresse, passer en "envoi", appeler le serveur, puis noter le résultat.
   */
  async function renvoyer() {
    // test() vérifie le format de l'adresse ; "return setEtatRenvoi(...)" met à jour l'état et sort de la fonction
    if (!/^\S+@\S+\.\S+$/.test(adresseDestinataire)) return setEtatRenvoi("erreur");
    setEtatRenvoi("envoi");
    try {
      await renvoyerEmailActivation(adresseDestinataire);
      setEtatRenvoi("envoye");
    } catch {
      // "catch" sans variable : on ne s'intéresse pas au détail de l'erreur
      setEtatRenvoi("erreur");
    }
  }

  return (
    <div className="mt-8 max-w-[620px] rounded-3xl border border-trait bg-white p-8 sm:p-10">
      <div className="flex items-center gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-menthe text-principal">
          <Mail aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-[22px] tracking-tight">{TITRES[statut]}</h2>
      </div>

      {/* Texte principal : un seul de ces blocs s'affiche, selon le statut ("&&" = afficher si vrai) */}
      <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-attenue">
        {statut === "en_attente" && (
          <>
            <p>
              Nous avons envoyé un lien d’activation à{" "}
              <strong className="text-encre">{email || "votre adresse e-mail"}</strong>.
            </p>
            <p>Ouvrez cet e-mail et suivez le lien pour activer votre compte Orca Flight.</p>
            <Bandeau ton="info">
              Ce lien est valide pendant 24 h. Passé ce délai, demandez un nouvel e-mail d’activation.
            </Bandeau>
          </>
        )}
        {statut === "succes" && <p>Votre compte est actif. Vous pouvez maintenant vous connecter.</p>}
        {statut === "expire" && (
          <Bandeau ton="erreur">
            Ce lien d’activation a expiré. Renvoyez l’e-mail pour recevoir un nouveau lien valide 24 h.
          </Bandeau>
        )}
        {statut === "invalide" && (
          <Bandeau ton="erreur">
            Ce lien d’activation n’est pas valide. Renvoyez l’e-mail pour en recevoir un nouveau.
          </Bandeau>
        )}
      </div>

      {/* Zone de renvoi de l'e-mail : seulement tant que le compte n'est pas activé */}
      {peutRenvoyer && (
        <div className="mt-6 space-y-4">
          {/* Si on ne connaît pas l'adresse (arrivée depuis le mail), on la demande */}
          {!email && (
            <Champ libelle="Adresse e-mail" type="email" icone={Mail} autoComplete="email" value={emailSaisi} onChange={(evenement) => setEmailSaisi(evenement.target.value)} />
          )}
          {statut === "en_attente" && (
            <p className="text-[13px] text-attenue">
              Vous ne trouvez pas l’e-mail ? Pensez à vérifier vos courriers indésirables avant de le renvoyer.
            </p>
          )}
          {etatRenvoi === "envoye" && (
            <Bandeau ton="succes">Un nouvel e-mail vient d’être envoyé à {adresseDestinataire}.</Bandeau>
          )}
          {etatRenvoi === "erreur" && (
            <Bandeau ton="erreur">Impossible d’envoyer l’e-mail. Vérifiez l’adresse puis réessayez.</Bandeau>
          )}
          <Bouton onClick={renvoyer} disabled={etatRenvoi === "envoi"} className="w-full">
            {etatRenvoi === "envoi" ? "Envoi…" : "Renvoyer l’e-mail"}
            {etatRenvoi !== "envoi" && <ArrowRight aria-hidden="true" className="size-4" />}
          </Bouton>
        </div>
      )}

      {/* Bas de carte : bouton "Me connecter" après un succès, sinon simple lien de retour */}
      {statut === "succes" ? (
        <Link to="/connexion" className={classeBouton("moyenne", "mt-6 w-full")}>
          Me connecter
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <p className="mt-6 text-center">
          <Link to="/connexion" className="inline-flex items-center gap-2 text-[13px] font-medium text-principal">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour à la connexion
          </Link>
        </p>
      )}
    </div>
  );
}
