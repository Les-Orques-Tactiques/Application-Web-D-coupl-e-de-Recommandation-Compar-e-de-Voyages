import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Champ, type PropsChamp } from "./Champ";

// Mêmes props que Champ, sauf "type" et "suffixe" : ce composant les gère lui-même
type Props = Omit<PropsChamp, "type" | "suffixe">;

/**
 * Champ mot de passe avec un bouton œil pour afficher ou masquer la saisie.
 * Le principe : on change simplement le type de l'<input> ("password" ↔ "text").
 */
export function ChampMotDePasse({ icone = Lock, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <Champ
      {...props}
      icone={icone} // cadenas par défaut, remplaçable si besoin
      type={visible ? "text" : "password"}
      suffixe={
        <button
          // type="button" est indispensable : sinon le clic enverrait le formulaire
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="rounded p-1 text-attenue transition-colors hover:text-principal focus-visible:outline-2 focus-visible:outline-principal"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
        </button>
      }
    />
  );
}
