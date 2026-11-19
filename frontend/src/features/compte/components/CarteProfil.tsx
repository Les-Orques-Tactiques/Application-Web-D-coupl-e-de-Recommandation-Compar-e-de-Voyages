import { useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/features/auth";
import { modifierProfil } from "@/features/auth/services/api";
import { messageErreur } from "../utils/messageErreur";
import { boutonPrincipal, carte, champ, etiquette, messageStatut, titreCarte } from "../utils/classes";

export function CarteProfil() {
    const { utilisateur, setUtilisateur } = useAuth();
    const [prenom, setPrenom] = useState(utilisateur?.prenom ?? "");
    const [nom, setNom] = useState(utilisateur?.nom ?? "");
    const [enCours, setEnCours] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Si l'utilisateur change (ex. rechargement du contexte), on resynchronise le formulaire
    useEffect(() => {
        setPrenom(utilisateur?.prenom ?? "");
        setNom(utilisateur?.nom ?? "");
    }, [utilisateur?.prenom, utilisateur?.nom]);

    async function enregistrer(evenement: SubmitEvent<HTMLFormElement>) {
        evenement.preventDefault();
        setEnCours(true);
        setMessage(null);
        try {
            // Le contexte est mis à jour : le prénom change aussi dans l'en-tête
            setUtilisateur(await modifierProfil({ prenom: prenom.trim(), nom: nom.trim() }));
            setMessage("Votre profil a bien été enregistré.");
        } catch (e: unknown) {
            setMessage(`Impossible d’enregistrer votre profil : ${messageErreur(e)}`);
        } finally {
            setEnCours(false);
        }
    }

    return (
        <section id="profil" className={carte}>
            <h2 className={titreCarte}>Mon profil</h2>
            <form onSubmit={enregistrer} className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <label className={etiquette}>
                        Prénom
                        <input className={champ} value={prenom} required minLength={2} maxLength={100}
                            onChange={(e) => setPrenom(e.target.value)} />
                    </label>
                    <label className={etiquette}>
                        Nom
                        <input className={champ} value={nom} required minLength={2} maxLength={100}
                            onChange={(e) => setNom(e.target.value)} />
                    </label>
                </div>
                <label className={etiquette}>
                    Adresse e-mail
                    <input className={champ} value={utilisateur?.email ?? ""} readOnly />
                </label>
                <p className="flex items-center gap-1 text-[12px] text-principal">
                    <Check className="size-3.5" aria-hidden="true" /> Adresse vérifiée
                </p>
                <button type="submit" className={boutonPrincipal} disabled={enCours}>
                    {enCours ? "Enregistrement…" : "Enregistrer le profil"}
                </button>
                {message && <p role="status" className={messageStatut}>{message}</p>}
                <Link to="/mot-de-passe-oublie" className="text-[12px] font-medium text-principal hover:underline">
                    Modifier mon mot de passe →
                </Link>
            </form>
        </section>
    );
}