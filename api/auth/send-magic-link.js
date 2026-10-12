import { Resend } from 'resend';
import { renderMagicLinkEmail } from '../../src/emails/emailTemplates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, magicLink } = req.body;
  if (!email || !magicLink) {
    return res.status(400).json({ error: 'Email et lien magique requis' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[AUTH] RESEND_API_KEY manquante. Magic link simulé dans les logs.');
    return res.status(200).json({ simulated: true, magicLink });
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hoya Poké <onboarding@resend.dev>';

  try {
    const html = renderMagicLinkEmail({ magicLink, email });
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Connexion à votre espace client · Hoya Poké',
      html
    });

    if (error) {
      console.error('[MAGIC LINK ERROR]', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[MAGIC LINK EXCEPTION]', err);
    return res.status(500).json({ error: err.message });
  }
}
