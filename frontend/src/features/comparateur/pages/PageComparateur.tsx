import {
  APPROCHES,
  CarteApproche,
  ClassementVols,
  CurseurAlpha,
  EnTeteComparateur,
  ParametresDemo,
  SousLeCapot,
  TableauMetriques,
  useComparateur,
} from "@/features/comparateur";

/**
 * Comparateur des approches de recommandation (/comparateur).
 * Affichée dans MiseEnPagePrivee, qui fournit l'en-tête et le pied de page.
 *
 * Comme PageExplorer, la page ne fait qu'assembler :
 * - useComparateur gère les états et les calculs de scores ;
 * - les composants s'occupent de l'affichage.
 */
export default function PageComparateur() {
  const comparateur = useComparateur();

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-16">
      <EnTeteComparateur />

      <ParametresDemo
        profils={comparateur.profils}
        profil={comparateur.profil}
        onChoisirProfil={comparateur.choisirProfil}
        k={comparateur.k}
        onChangerK={comparateur.changerK}
        rafraichissement={comparateur.rafraichissement}
        onComparer={comparateur.comparer}
      />

      <div aria-label="Les trois approches de recommandation" className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {APPROCHES.map(approche => (
          <CarteApproche
            key={approche.id}
            approche={approche}
            active={comparateur.approche === approche.id}
            onChoisir={() => comparateur.choisirApproche(approche.id)}
          />
        ))}
      </div>

      <CurseurAlpha
        alpha={comparateur.alpha}
        sansHistorique={comparateur.sansHistorique}
        onChanger={comparateur.changerAlpha}
        premierVol={comparateur.premierVol}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ClassementVols
          vols={comparateur.volsClasses}
          approche={comparateur.approche}
          sansHistorique={comparateur.sansHistorique}
          decouverteB={comparateur.decouverteB}
          premierVol={comparateur.premierVol}
        />
        <TableauMetriques metriques={comparateur.profil.metriques} k={comparateur.k} />
      </div>

      <SousLeCapot />
    </section>
  );
}