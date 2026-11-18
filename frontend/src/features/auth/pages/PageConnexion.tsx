import { SurTitre } from "@/components/ui/SurTitre";
import { FormulaireConnexion } from "@/features/auth";

/**
 * Page de connexion (/connexion) : titre d'accueil et carte blanche centrée contenant
 * le formulaire. La logique de connexion est dans FormulaireConnexion.
 */
export default function PageConnexion() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-16 lg:py-14">
      <SurTitre>Heureux de vous retrouver</SurTitre>
      <h1 className="mt-3 text-[40px] font-normal leading-tight tracking-tight">Reprenez le fil de vos envies.</h1>
      <p className="mt-3 text-[15px] text-attenue">Vos favoris, vos recherches et des vols toujours mieux adaptés.</p>

      <div className="mx-auto mt-10 max-w-[620px] rounded-3xl border border-trait bg-white p-8 sm:p-10">
        <h2 className="text-[22px] tracking-tight">Connexion</h2>
        <FormulaireConnexion />
      </div>
    </section>
  );
}
