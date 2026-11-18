import { FormulaireReinitialisation } from "@/features/auth/components/FormulaireReinitialisation";

export default function PageReinitialisation() {
  return (
    <section className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-2 text-[14px] text-attenue">
        Choisissez un nouveau mot de passe. Vous serez déconnecté de vos autres appareils.
      </p>
      <FormulaireReinitialisation />
    </section>
  );
}