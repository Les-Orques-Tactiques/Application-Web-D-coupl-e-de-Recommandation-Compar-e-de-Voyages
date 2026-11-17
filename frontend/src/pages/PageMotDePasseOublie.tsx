import { FormulaireMotDePasseOublie } from "@/features/auth/components/FormulaireMotDePasseOublie";

export default function PageMotDePasseOublie() {
  return (
    <section className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-[14px] text-attenue">
        Indiquez l’adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </p>
      <FormulaireMotDePasseOublie />
    </section>
  );
}