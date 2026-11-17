import { ShieldCheck } from "lucide-react";
import { SurTitre } from "@/components/ui/SurTitre";
import { FormulaireInscription } from "@/features/auth";

/**
 * Page d'inscription (/inscription). Elle est "mince" : elle ne contient que la mise en page
 * (panneau sombre à gauche, formulaire à droite). Toute la logique est dans FormulaireInscription.
 *
 * "export default" : la page est exportée par défaut, c'est ce que le routeur importe.
 */
export default function PageInscription() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-16 lg:py-14">
      {/* Grille : une colonne sur mobile, puis 490 px (panneau) + le reste (formulaire) sur grand écran */}
      <div className="grid gap-10 lg:grid-cols-[490px_1fr] lg:gap-20">
        <aside className="flex flex-col rounded-3xl bg-profond p-8 text-white">
          <span className="w-fit rounded-full bg-citron px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-profond">
            Votre prochain départ commence ici
          </span>
          <h2 className="mt-6 text-[34px] font-semibold leading-[1.1] tracking-tight">
            Un compte.
            <br />
            Des choix plus justes.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80">
            Retrouvez vos favoris et découvrez pourquoi chaque vol vous est proposé. Vos préférences restent modifiables à tout moment.
          </p>
          {/* L'image est dans public/images ; "alt" décrit l'image pour les lecteurs d'écran */}
          <img
            src="/images/hublot.jpg"
            alt="Côte vue depuis le hublot d’un avion"
            className="mt-8 aspect-[396/272] w-full rounded-2xl object-cover"
          />
          <p className="mt-6 flex items-start gap-3 text-sm text-white/80">
            <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-citron" />
            Aucun consentement facultatif n’est nécessaire pour explorer les vols.
          </p>
        </aside>

        <div className="max-w-[560px]">
          <SurTitre>01 / Rejoindre Orca Flight</SurTitre>
          <h1 className="mt-3 text-[40px] font-normal leading-tight tracking-tight">Créez votre compte.</h1>
          <p className="mt-3 text-[15px] text-attenue">Quelques informations, puis un e-mail pour activer votre accès.</p>
          <FormulaireInscription />
        </div>
      </div>
    </section>
  );
}
