import { useEffect, useState, type SubmitEvent } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/features/auth";
import { modifierProfil, changerMotDePasse } from "@/features/auth/services/api";
import { messageErreur } from "../utils/messageErreur";
import { boutonPrincipal, carte, champ, etiquette, messageStatut, titreCarte } from "../utils/classes";

type PropsChampMotDePasse = {
    libelle: string;
    valeur: string;
    onChange: (valeur: string) => void;
    autoComplete: "current-password" | "new-password";
    minLength?: number;
};

function ChampMotDePasse({ libelle, valeur, onChange, autoComplete, minLength }: PropsChampMotDePasse) {
    const [visible, setVisible] = useState(false);

    return (
        <label className={etiquette}>
            {libelle}
            <div className="relative">
                <input
                    className={`${champ} pr-10`}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    value={valeur}
                    required
                    minLength={minLength}
                    onChange={(e) => onChange(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-principal"
                >
                    {visible
                        ? <EyeOff className="size-4" aria-hidden="true" />
                        : <Eye className="size-4" aria-hidden="true" />}
                </button>
            </div>
        </label>
    );
}

export function CarteProfil() {
    const { utilisateur, setUtilisateur } = useAuth();
    const [prenom, setPrenom] = useState(utilisateur?.prenom ?? "");
    const [nom, setNom] = useState(utilisateur?.nom ?? "");
    const [enCours, setEnCours] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [mdpOuvert, setMdpOuvert] = useState(false);
    const [ancien, setAncien] = useState("");
    const [nouveau, setNouveau] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [enCoursMdp, setEnCoursMdp] = useState(false);
    const [messageMdp, setMessageMdp] = useState<string | null>(null);

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

    async function soumettreMotDePasse(evenement: SubmitEvent<HTMLFormElement>) {
        evenement.preventDefault();
        if (nouveau !== confirmation) {
            setMessageMdp("Les deux mots de passe ne correspondent pas.");
            return;
        }
        setEnCoursMdp(true);
        setMessageMdp(null);
        try {
            // Le back réémet les cookies de cette session : on reste connecté
            setUtilisateur(await changerMotDePasse(ancien, nouveau));
            setAncien("");
            setNouveau("");
            setConfirmation("");
            setMdpOuvert(false);
            setMessage("Votre mot de passe a bien été modifié.");
        } catch (e: unknown) {
            setMessageMdp(`Impossible de modifier le mot de passe : ${messageErreur(e)}`);
        } finally {
            setEnCoursMdp(false);
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
            </form>

            {!mdpOuvert ? (
                <button
                    type="button"
                    onClick={() => setMdpOuvert(true)}
                    className="mt-3 text-[12px] font-medium text-principal hover:underline"
                >
                    Modifier mon mot de passe →
                </button>
            ) : (
                <form onSubmit={soumettreMotDePasse} className="mt-4 grid gap-3 border-t pt-4">
                    <ChampMotDePasse
                        libelle="Mot de passe actuel"
                        valeur={ancien}
                        onChange={setAncien}
                        autoComplete="current-password"
                    />
                    <ChampMotDePasse
                        libelle="Nouveau mot de passe"
                        valeur={nouveau}
                        onChange={setNouveau}
                        autoComplete="new-password"
                        minLength={8}
                    />
                    <ChampMotDePasse
                        libelle="Confirmer le nouveau mot de passe"
                        valeur={confirmation}
                        onChange={setConfirmation}
                        autoComplete="new-password"
                        minLength={8}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className={boutonPrincipal} disabled={enCoursMdp}>
                            {enCoursMdp ? "Enregistrement…" : "Changer le mot de passe"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMdpOuvert(false); setMessageMdp(null); }}
                            className="text-[12px] font-medium text-principal hover:underline"
                        >
                            Annuler
                        </button>
                    </div>
                    {messageMdp && <p role="status" className={messageStatut}>{messageMdp}</p>}
                </form>
            )}
        </section>
    );
}