import { Resend } from 'resend';
import { 
  renderOrderConfirmationEmail, 
  renderOrderReadyEmail, 
  renderWelcomeEmail, 
  renderLoyaltyRewardEmail 
} from '../../src/emails/emailTemplates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] RESEND_API_KEY manquante. Email simulé.');
    return res.status(200).json({ simulated: true, message: 'Clé API Resend non configurée, envoi simulé.' });
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hoya Poké <onboarding@resend.dev>';
  const { type, recipientEmail, customerName, order, currentStamps } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Adresse email requise' });
  }

  try {
    let subject = '';
    let html = '';

    switch (type) {
      case 'ORDER_CONFIRMATION':
        subject = `Confirmation de commande #${order?.id || ''} · Hoya Poké`;
        html = renderOrderConfirmationEmail({ order: order || {}, customerName: customerName || 'Client' });
        break;

      case 'ORDER_READY':
        subject = `Votre commande #${order?.id || ''} est prête ! · Hoya Poké`;
        html = renderOrderReadyEmail({ order: order || {}, customerName: customerName || 'Client' });
        break;

      case 'WELCOME':
        subject = 'Bienvenue chez Hoya Poké ! Carte de fidélité activée 🌱';
        html = renderWelcomeEmail({ firstName: customerName || 'Client', currentStamps: currentStamps || 1 });
        break;

      case 'LOYALTY_REWARD':
        subject = '🎁 Votre 11ᵉ bol est offert chez Hoya Poké !';
        html = renderLoyaltyRewardEmail({ firstName: customerName || 'Fidèle client' });
        break;

      default:
        return res.status(400).json({ error: 'Type d\'email inconnu' });
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject,
      html
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[API EXCEPTION]', err);
    return res.status(500).json({ error: err.message });
  }
}
