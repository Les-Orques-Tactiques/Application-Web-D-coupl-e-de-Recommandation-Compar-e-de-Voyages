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
  const c = useComparateur();

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-16">
      <EnTeteComparateur />

      <ParametresDemo
        profils={c.profils}
        profil={c.profil}
        onChoisirProfil={c.choisirProfil}
        k={c.k}
        onChangerK={c.changerK}
        rafraichissement={c.rafraichissement}
        onComparer={c.comparer}
      />

      <div aria-label="Les trois approches de recommandation" className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {APPROCHES.map(approche => (
          <CarteApproche
            key={approche.id}
            approche={approche}
            active={c.approche === approche.id}
            onChoisir={() => c.choisirApproche(approche.id)}
          />
        ))}
      </div>

      <CurseurAlpha
        alpha={c.alpha}
        sansHistorique={c.sansHistorique}
        onChanger={c.changerAlpha}
        premierVol={c.premierVol}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ClassementVols
          vols={c.volsClasses}
          approche={c.approche}
          sansHistorique={c.sansHistorique}
          decouverteB={c.decouverteB}
          premierVol={c.premierVol}
        />
        <TableauMetriques metriques={c.profil.metriques} k={c.k} />
      </div>

      <SousLeCapot />
    </section>
  );
}