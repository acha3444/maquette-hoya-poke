import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gfdkjcxcowztlbjfdlfd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZGtqY3hjb3d6dGxiamZkbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTE5NTUsImV4cCI6MjEwNzI4Nzk1NX0.f7jxHf8q-0YXbLFffMuW9mr2NdKmdAMWWa6VQtQ08Mc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const event = req.body;
  if (!event || !event.type) {
    return res.status(400).json({ error: 'Événement invalide' });
  }

  const { type, data } = event;
  const email = data?.to?.[0];

  try {
    // 1. Journalisation de l'événement dans email_logs
    if (email) {
      await supabase.from('email_logs').insert({
        recipient_email: email,
        email_type: 'WEBHOOK_EVENT',
        resend_id: data?.email_id,
        status: type,
        error_message: data?.bounce?.message || null
      });
    }

    // 2. Gestion des Rebonds (Bounces) et Plaintes (Complaints) : Désabonnement automatique strict RGPD
    if (type === 'email.bounced' || type === 'email.complained') {
      if (email) {
        console.warn(`[RESEND WEBHOOK] Désabonnement automatique pour ${email} (type: ${type})`);
        await supabase
          .from('customer_profiles')
          .update({
            marketing_consent: false,
            unsubscribed_at: new Date().toISOString()
          })
          .eq('email', email);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[WEBHOOK EXCEPTION]', err);
    return res.status(500).json({ error: err.message });
  }
}
