import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SurTitre } from "@/components/ui/SurTitre";
import { useAuth } from "@/features/auth/contexte/useAuth";
import { FormulairePreferences } from "@/features/preferences";

export default function PageOnboarding() {
  const { utilisateur } = useAuth();

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-16 lg:py-14">
      <div className="flex items-start justify-between gap-6">
        <div>
          <SurTitre>Bienvenue, {utilisateur?.prenom}</SurTitre>
          <h1 className="mt-3 text-[40px] font-normal leading-tight tracking-tight">
            Votre voyage commence par vous.
          </h1>
          <p className="mt-3 text-[15px] text-attenue">
            Quelques repères pour mieux recommander vos vols. Cette étape est facultative.
          </p>
        </div>
        <Link to="/explorer" className="flex shrink-0 items-center gap-2 text-sm font-medium text-principal">
          Passer cette étape <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <FormulairePreferences />
    </section>
  );
}