import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { Champ } from "@/components/ui/Champ";
import { lireAeroport, rechercherAeroports, type Aeroport } from "../services/referentielApi";

const LONGUEUR_MIN_RECHERCHE = 2;
const DELAI_SAISIE_MS = 250;

export function ChampAeroport({ libelle, code, onChoisir, onEffacer }: {
  libelle: string;
  code: string;
  onChoisir: (aeroport: Aeroport) => void;
  onEffacer?: () => void;
}) {
  const idListe = useId();
  const [texte, setTexte] = useState("");
  const [suggestions, setSuggestions] = useState<Aeroport[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [enCours, setEnCours] = useState(false);

  // Code dont le libellé est déjà affiché : évite de réécrire le texte pendant la frappe
  const codeAffiche = useRef("");

  // Synchronise le texte quand le code change de l'extérieur (préremplissage, reprise d'historique)
  useEffect(() => {
    if (code === codeAffiche.current) return;
    codeAffiche.current = code;
    if (code === "") {
      setTexte("");
      return;
    }
    let vivant = true;
    lireAeroport(code)
      .then((a) => { if (vivant) setTexte(a.libelle); })
      .catch(() => { if (vivant) setTexte(code); }); // repli : on montre au moins le code
    return () => { vivant = false; };
  }, [code]);

  // Recherche avec délai ; les réponses périmées sont ignorées
  useEffect(() => {
    const saisie = texte.trim();
    if (!ouvert || saisie.length < LONGUEUR_MIN_RECHERCHE) {
      setSuggestions([]);
      setEnCours(false);
      return;
    }
    let vivant = true;
    setEnCours(true);
    const minuteur = setTimeout(() => {
      rechercherAeroports(saisie)
        .then((liste) => {
          if (!vivant) return;
          setSuggestions(liste);
          setActif(-1);
        })
        .catch(() => { if (vivant) setSuggestions([]); })
        .finally(() => { if (vivant) setEnCours(false); });
    }, DELAI_SAISIE_MS);
    return () => {
      vivant = false;
      clearTimeout(minuteur);
    };
  }, [texte, ouvert]);

  function choisir(a: Aeroport) {
    codeAffiche.current = a.code_iata;
    setTexte(a.libelle);
    setOuvert(false);
    setSuggestions([]);
    setActif(-1);
    onChoisir(a);
  }

  function gererTouche(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setOuvert(true);
      setActif((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActif((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && ouvert) {
      e.preventDefault(); // ne soumet jamais le formulaire parent
      if (actif >= 0 && suggestions[actif]) choisir(suggestions[actif]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  }

  const afficherListe = ouvert && texte.trim().length >= LONGUEUR_MIN_RECHERCHE;

  return (
    <div className="relative">
      <Champ
        libelle={libelle}
        icone={MapPin}
        placeholder="Ville ou aéroport"
        value={texte}
        role="combobox"
        aria-expanded={afficherListe}
        aria-controls={idListe}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          setTexte(e.target.value);
          setOuvert(true);
          if (e.target.value === "") {
            codeAffiche.current = "";
            onEffacer?.();
          }
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={gererTouche}
      />

      {afficherListe && (
        <ul
          id={idListe}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-trait bg-white py-1 shadow-lg"
        >
          {enCours && suggestions.length === 0 && (
            <li className="px-4 py-2 text-[13px] text-attenue">Recherche…</li>
          )}
          {!enCours && suggestions.length === 0 && (
            <li className="px-4 py-2 text-[13px] text-attenue">Aucun aéroport trouvé</li>
          )}
          {suggestions.map((a, i) => (
            <li
              key={a.code_iata}
              role="option"
              aria-selected={i === actif}
              // onMouseDown plutôt que onClick : il part avant le onBlur du champ
              onMouseDown={(e) => {
                e.preventDefault();
                choisir(a);
              }}
              className={`cursor-pointer px-4 py-2 text-[14px] ${i === actif ? "bg-black/5" : "hover:bg-black/5"}`}
            >
              {a.libelle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}