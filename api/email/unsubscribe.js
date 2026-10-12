import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gfdkjcxcowztlbjfdlfd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZGtqY3hjb3d6dGxiamZkbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTE5NTUsImV4cCI6MjEwNzI4Nzk1NX0.f7jxHf8q-0YXbLFffMuW9mr2NdKmdAMWWa6VQtQ08Mc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  // Supporte à la fois POST (RFC 8058 One-Click) et GET (clic humain dans le mail)
  const token = req.query.token || req.body?.token;

  if (!token) {
    return res.status(400).send('Jeton de désinscription manquant.');
  }

  try {
    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .update({
        marketing_consent: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select('email')
      .maybeSingle();

    if (error) {
      console.error('[UNSUBSCRIBE ERROR]', error);
    }

    if (req.method === 'POST') {
      return res.status(200).json({ success: true, message: 'Désinscription enregistrée avec succès.' });
    }

    // Affichage d'une page HTML propre pour le client
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Désinscription confirmée · Hoya Poké</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #faf5f0; color: #0f1a14; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: white; padding: 40px; border-radius: 20px; max-width: 440px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          h1 { color: #1e3325; font-size: 22px; margin-top: 12px; }
          p { color: #556b5b; line-height: 1.6; font-size: 15px; }
          a { display: inline-block; margin-top: 20px; background: #1e3325; color: #faf5f0; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 40px;">🥗</div>
          <h1>Désinscription prise en compte</h1>
          <p>L'adresse <strong>${profile?.email || 'associée'}</strong> a bien été retirée de nos listes d'offres et nouveautés Hoya Poké.</p>
          <p style="font-size: 13px; color: #7a8c80;">Vous continuerez uniquement à recevoir les confirmations de vos futures commandes.</p>
          <a href="https://hoyapoke.fr">Retour au restaurant</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[UNSUBSCRIBE EXCEPTION]', err);
    return res.status(500).send('Une erreur est survenue lors de votre désinscription.');
  }
}
