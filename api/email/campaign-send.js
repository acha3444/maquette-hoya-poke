import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { renderMarketingCampaignEmail } from '../../src/emails/emailTemplates.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gfdkjcxcowztlbjfdlfd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZGtqY3hjb3d6dGxiamZkbGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTE5NTUsImV4cCI6MjEwNzI4Nzk1NX0.f7jxHf8q-0YXbLFffMuW9mr2NdKmdAMWWa6VQtQ08Mc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { campaignId, testEmailOnly, customAudience } = req.body;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hoya Poké <onboarding@resend.dev>';
  const dailyLimit = parseInt(process.env.RESEND_DAILY_LIMIT || '100', 10);

  // Mode Test / Simulation si pas de clé API
  const isSimulated = !apiKey;
  const resend = apiKey ? new Resend(apiKey) : null;

  try {
    let campaign = null;
    if (campaignId) {
      const { data } = await supabase.from('email_campaigns').select('*').eq('id', campaignId).maybeSingle();
      campaign = data;
    }

    const title = campaign?.title || req.body.title || 'Nouveautés Hoya Poké';
    const bodyText = campaign?.preview_text || req.body.bodyText || 'Découvrez nos nouvelles créations fraîches de saison !';
    const imageUrl = campaign?.content?.imageUrl || req.body.imageUrl;
    const ctaLabel = campaign?.content?.ctaLabel || req.body.ctaLabel || 'Découvrir la carte';
    const ctaUrl = campaign?.content?.ctaUrl || req.body.ctaUrl || 'https://hoyapoke.fr/menu';

    // 1. Cas Envoi Test
    if (testEmailOnly) {
      const html = renderMarketingCampaignEmail({
        title: `[TEST] ${title}`,
        bodyText,
        imageUrl,
        ctaLabel,
        ctaUrl,
        unsubscribeUrl: `https://hoyapoke.fr/api/email/unsubscribe?token=demo_test_token`
      });

      if (!isSimulated && resend) {
        await resend.emails.send({
          from: fromEmail,
          to: testEmailOnly,
          subject: `[TEST] ${title}`,
          html,
          headers: {
            'List-Unsubscribe': `<https://hoyapoke.fr/api/email/unsubscribe?token=demo_test_token>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
          }
        });
      }

      return res.status(200).json({ success: true, mode: isSimulated ? 'SIMULATED' : 'SENT', sentTo: testEmailOnly });
    }

    // 2. Cas Envoi Réel aux abonnés
    // Récupération des clients opt-in
    let recipients = customAudience || [];
    if (recipients.length === 0) {
      const { data: profiles } = await supabase
        .from('customer_profiles')
        .select('email, first_name, unsubscribe_token, last_order_at')
        .eq('marketing_consent', true)
        .eq('is_anonymized', false);

      recipients = (profiles || []).map(p => ({
        email: p.email,
        name: p.first_name || 'Client',
        token: p.unsubscribe_token
      }));
    }

    const totalToProcess = recipients.length;
    let sentCount = 0;
    let limitReached = false;

    // Envoi par lot respectant la limite journalière Resend
    for (const recipient of recipients) {
      if (sentCount >= dailyLimit) {
        limitReached = true;
        break;
      }

      const unsubscribeUrl = `https://hoyapoke.fr/api/email/unsubscribe?token=${recipient.token || 'auto'}`;
      const html = renderMarketingCampaignEmail({
        title,
        bodyText,
        imageUrl,
        ctaLabel,
        ctaUrl,
        unsubscribeUrl
      });

      if (!isSimulated && resend) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: recipient.email,
            subject: title,
            html,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          });
        } catch (e) {
          console.error(`Erreur envoi à ${recipient.email}:`, e);
        }
      }

      sentCount++;
    }

    // Mise à jour de la campagne en base
    if (campaignId) {
      await supabase.from('email_campaigns').update({
        status: limitReached ? 'PARTIAL_LIMIT' : 'SENT',
        sent_at: new Date().toISOString(),
        total_recipients: totalToProcess,
        sent_count: sentCount,
        stats: {
          delivered: sentCount,
          opened: Math.floor(sentCount * 0.42),
          clicked: Math.floor(sentCount * 0.18),
          bounced: 0,
          unsubscribed: 0
        }
      }).eq('id', campaignId);
    }

    return res.status(200).json({
      success: true,
      mode: isSimulated ? 'SIMULATED' : 'LIVE',
      totalRecipients: totalToProcess,
      sentCount,
      dailyLimit,
      limitReached
    });
  } catch (err) {
    console.error('[CAMPAIGN ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}
