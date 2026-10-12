import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Mail, Lock, FileText } from 'lucide-react';
import HoyaMark from '../components/brand/HoyaMark';

export default function PrivacyPolicyView() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--ink)', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ background: 'var(--green-900)', color: 'var(--cream)', padding: '24px 20px', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Retour"
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: 8, borderRadius: 12, cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: 'var(--cream)', fontWeight: 800 }}>
              Politique de Confidentialité & RGPD
            </h1>
            <span style={{ fontSize: 12, color: 'var(--curry)', opacity: 0.9 }}>
              Hoya Poké – Pézenas · Dernière mise à jour : 12 octobre 2026
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 760, margin: '24px auto 0', padding: '0 20px', lineHeight: 1.7, fontSize: 15 }}>
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 2px 14px rgba(15,26,20,0.06)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, color: 'var(--green-800)' }}>
            <ShieldCheck size={28} />
            <h2 style={{ margin: 0, fontSize: 22, color: 'var(--green-900)' }}>Engagement de protection de vos données</h2>
          </div>

          <p>
            Le restaurant <strong>Hoya Poké – Pézenas</strong> (exploité sous l'entité légale <strong>[HOYA POKE, SIREN 981 349 723, 7 Rue Anatole France, 34120 Pézenas]</strong>) attache une importance primordiale à la protection et à la confidentialité de vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique et Libertés.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #ebd9c8', margin: '24px 0' }} />

          <h3 style={{ color: 'var(--green-900)', fontSize: 18 }}>1. Données collectées</h3>
          <p>Dans le cadre de l'utilisation de nos services de commande et de fidélité, nous pouvons collecter les catégories suivantes :</p>
          <ul>
            <li><strong>Données d'identification :</strong> Prénom, adresse email, numéro de téléphone.</li>
            <li><strong>Données de livraison :</strong> Adresse postale de livraison, instructions pour le livreur.</li>
            <li><strong>Données de commande :</strong> Historique des pokés et articles achetés, montant total, date et heure, mode de règlement (sur place, en ligne, au comptoir).</li>
            <li><strong>Données de fidélité :</strong> Nombre de tampons acquis, récompenses débloquées.</li>
            <li><strong>Consentement marketing :</strong> Choix d'adhésion aux offres promotionnelles par email, date d'acceptation et jeton de désinscription sécurisé.</li>
          </ul>

          <h3 style={{ color: 'var(--green-900)', fontSize: 18, marginTop: 24 }}>2. Finalités et bases légales</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--cream)', borderBottom: '2px solid #ebd9c8' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Finalité</th>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Base légale (RGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ebd9c8' }}>
                <td style={{ padding: '10px 12px' }}>Préparation, livraison et suivi de votre commande</td>
                <td style={{ padding: '10px 12px' }}>Exécution du contrat (Art. 6.1.b)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ebd9c8' }}>
                <td style={{ padding: '10px 12px' }}>Gestion du programme de fidélité (tampons & bol offert)</td>
                <td style={{ padding: '10px 12px' }}>Exécution du contrat / CGV (Art. 6.1.b)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ebd9c8' }}>
                <td style={{ padding: '10px 12px' }}>Envoi d'offres promotionnelles et nouveautés par email</td>
                <td style={{ padding: '10px 12px' }}>Consentement explicite et révocable (Art. 6.1.a)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px' }}>Obligations comptables et conservation des factures</td>
                <td style={{ padding: '10px 12px' }}>Obligation légale (Art. 6.1.c)</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ color: 'var(--green-900)', fontSize: 18, marginTop: 24 }}>3. Durée de conservation</h3>
          <ul>
            <li><strong>Prospection commerciale :</strong> Les données sont conservées pendant un délai maximum de <strong>3 ans</strong> à compter de votre dernière commande ou interaction active. Au-delà, elles sont automatiquement anonymisées ou supprimées.</li>
            <li><strong>Données comptables :</strong> Les historiques de commandes et factures sont conservés pendant <strong>10 ans</strong> sous forme strictement anonymisée (sans nom, sans email ni téléphone nominatifs) conformément aux règles du Code de commerce.</li>
          </ul>

          <h3 style={{ color: 'var(--green-900)', fontSize: 18, marginTop: 24 }}>4. Vos droits RGPD</h3>
          <p>Vous disposez des droits suivants, exerçables à tout moment depuis votre espace <em>Mon Compte</em> ou en nous contactant :</p>
          <ul>
            <li><strong>Droit d'accès et de portabilité :</strong> Téléchargez l'intégralité de vos données en format standard (JSON) en 1 clic.</li>
            <li><strong>Droit de rectification :</strong> Modifiez vos coordonnées et vos adresses directement dans votre profil.</li>
            <li><strong>Droit à l'effacement (« Droit à l'oubli ») :</strong> Supprimez votre compte et vos données personnelles directement depuis la page de votre compte.</li>
            <li><strong>Droit d'opposition et de désinscription :</strong> Chaque email commercial comporte un lien de désinscription immédiat en 1 clic.</li>
          </ul>

          <h3 style={{ color: 'var(--green-900)', fontSize: 18, marginTop: 24 }}>5. Sous-traitants & Hébergement</h3>
          <p>Vos données sont traitées via les prestataires sécurisés suivants, respectant les normes européennes :</p>
          <ul>
            <li><strong>Hébergement de l'application :</strong> Vercel Inc.</li>
            <li><strong>Base de données & Authentification :</strong> Supabase Inc. (infrastructure chiffrée avec Row Level Security).</li>
            <li><strong>Routage des emails :</strong> Resend Inc.</li>
          </ul>

          <h3 style={{ color: 'var(--green-900)', fontSize: 18, marginTop: 24 }}>6. Contact & Délégué à la protection des données</h3>
          <p>
            Pour toute question relative à vos données personnelles ou pour exercer vos droits :<br />
            <strong>Email :</strong> <a href="mailto:contact@hoyapoke.fr" style={{ color: 'var(--green-800)', fontWeight: 700 }}>[contact@hoyapoke.fr]</a><br />
            <strong>Adresse postale :</strong> [Hoya Poké – DPO, 7 Rue Anatole France, 34120 Pézenas]<br />
            Vous avez également le droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>).
          </p>

        </div>
      </main>
    </div>
  );
}
