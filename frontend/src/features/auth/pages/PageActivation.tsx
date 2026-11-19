import { useLocation, useSearchParams } from "react-router-dom";
import { SurTitre } from "@/components/ui/SurTitre";
import { CarteActivation, emailEnAttente, useActivation } from "@/features/auth";

/**
 * Page d'activation du compte (/activation). Deux cas d'arrivée :
 *  1. juste après l'inscription : pas de jeton, on affiche "Vérifiez votre boîte mail" ;
 *  2. depuis le lien reçu par e-mail (/activation?jeton=XXXX) : on active le compte.
 */
export default function PageActivation() {
  // useSearchParams lit les paramètres de l'adresse (ce qui suit le "?")
  const [parametresUrl] = useSearchParams();
  // useLocation donne accès aux informations passées par la page précédente (state)
  const emplacement = useLocation();
  // Le hook s'occupe de contacter le serveur et renvoie le statut à afficher
  const statut = useActivation(parametresUrl.get("jeton"));
  // L'adresse vient de l'inscription qui vient d'avoir lieu ; à défaut, de la session du navigateur.
  // "as" indique à TypeScript la forme de state ; "?." évite une erreur si state est vide (null)
  const email = (emplacement.state as { email?: string } | null)?.email ?? emailEnAttente.lire();

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 text-center lg:px-16 lg:py-14">
      <SurTitre>02 / Activer votre compte</SurTitre>
      <h1 className="mt-3 text-[40px] font-normal leading-tight tracking-tight">Vérifiez votre boîte mail.</h1>
      <p className="mt-3 text-[15px] text-attenue">
        Un dernier geste pour retrouver vos favoris et des vols qui vous ressemblent.
      </p>
      <CarteActivation statut={statut} email={email} />
    </section>
  );
}