/**
 * Modèles d'emails transactionnels et marketing Hoya Poké
 * Compatibles Gmail, Apple Mail, Outlook, mobile, dark-mode friendly
 */

export const BRAND_COLORS = {
  forest: '#0f1a14',
  green800: '#1e3325',
  green700: '#2d4d38',
  curry: '#d4a373',
  cream: '#faf5f0',
  white: '#ffffff',
  muted: '#7a8c80',
  ink: '#15241b'
};

function baseEmailLayout({ title, previewText, content, unsubscribeUrl, isMarketing = false }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4ede6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #15241b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 24px auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 26, 20, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0f1a14 0%, #1e3325 100%);
      padding: 36px 30px;
      text-align: center;
      color: #faf5f0;
    }
    .header h1 {
      margin: 12px 0 0 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #faf5f0;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #d4a373;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }
    .body {
      padding: 36px 32px;
      font-size: 15px;
      line-height: 1.6;
      color: #2d3e33;
    }
    .btn {
      display: inline-block;
      background-color: #1e3325;
      color: #faf5f0 !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 999px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(30, 51, 37, 0.25);
    }
    .card {
      background-color: #faf5f0;
      border-radius: 14px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #ebd9c8;
    }
    .footer {
      background-color: #f7f3ee;
      padding: 28px 24px;
      text-align: center;
      font-size: 12px;
      color: #7a8c80;
      border-top: 1px solid #ebd9c8;
      line-height: 1.5;
    }
    .footer a {
      color: #1e3325;
      text-decoration: underline;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0b140f; color: #e1dcd6; }
      .wrapper { background-color: #14221a; }
      .body { color: #e1dcd6; }
      .card { background-color: #1b2e23; border-color: #2c4938; }
      .footer { background-color: #0f1a14; border-color: #1e3325; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <div style="font-size: 32px;">🥗</div>
      <h1>Hoya Poké</h1>
      <p>Pézenas · Healthy Food & Coffee</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <strong>Hoya Poké – Pézenas</strong><br>
      7 Rue Anatole France, 34120 Pézenas · 04 67 21 42 98<br>
      SIREN : 981 349 723 · Ouvert du lundi au samedi<br><br>
      ${isMarketing && unsubscribeUrl ? `
        Vous recevez cet email car vous avez accepté les offres Hoya Poké.<br>
        <a href="${unsubscribeUrl}">Se désinscrire en 1 clic</a> · <a href="https://hoyapoke.fr/confidentialite">Politique de confidentialité</a>
      ` : `
        Email transactionnel lié à votre commande ou votre compte Hoya Poké.<br>
        <a href="https://hoyapoke.fr/confidentialite">Protection des données personnelles</a>
      `}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Email de confirmation de commande
 */
export function renderOrderConfirmationEmail({ order, customerName = 'Client' }) {
  const itemsList = (order.items || []).map(i => `
    <tr style="border-bottom: 1px solid #e5ded7;">
      <td style="padding: 10px 0; font-weight: 600;">${i.cartName || i.name} ${i.size ? `(${i.size})` : ''}</td>
      <td style="padding: 10px 0; text-align: right; color: #1e3325; font-weight: 700;">${Number(i.price || 0).toFixed(2)} €</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="margin-top: 0; color: #1e3325;">Merci pour votre commande, ${customerName} !</h2>
    <p>Nous avons bien reçu votre commande <strong>#${order.id}</strong> et notre équipe en cuisine commence déjà à la préparer avec des ingrédients frais du jour.</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 700;">
        <span>Mode : ${order.type === 'LIVRAISON' ? '🛵 Livraison' : order.type === 'SUR_PLACE' ? '🍽️ Sur place' : '🛍️ À emporter'}</span>
        <span>Heure estimée : ${order.time || 'Dans ~20 min'}</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsList}
        <tr>
          <td style="padding: 12px 0 0 0; font-weight: 800; font-size: 16px;">Total réglé</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-weight: 800; font-size: 18px; color: #1e3325;">${Number(order.total || 0).toFixed(2)} €</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center;">
      <a href="https://hoyapoke.fr/tracking" class="btn">Suivre ma commande en direct</a>
    </p>
  `;

  return baseEmailLayout({
    title: `Confirmation de commande #${order.id} · Hoya Poké`,
    previewText: `Votre commande #${order.id} est en préparation en cuisine !`,
    content,
    isMarketing: false
  });
}

/**
 * 2. Email de commande prête / en cours de livraison
 */
export function renderOrderReadyEmail({ order, customerName = 'Client' }) {
  const isDelivery = order.type === 'LIVRAISON';
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🎉</span>
      <h2 style="color: #1e3325; margin: 12px 0;">${isDelivery ? 'Votre livreur est en route !' : 'Votre commande est prête !'}</h2>
      <p style="font-size: 16px; color: #556b5b;">
        ${isDelivery 
          ? `Votre livreur Hoya Poké arrive à votre adresse : <strong>${order.address}</strong>.` 
          : 'Vos pokés frais vous attendent au restaurant : <strong>7 Rue Anatole France, Pézenas</strong>.'}
      </p>
    </div>

    <div class="card" style="text-align: center;">
      <span style="font-size: 13px; text-transform: uppercase; color: #7a8c80; font-weight: 700;">Numéro de commande</span>
      <div style="font-size: 32px; font-weight: 900; color: #1e3325; margin: 6px 0;">#${order.id}</div>
      <span style="font-size: 13px; color: #d4a373; font-weight: 600;">Présentez ce numéro au comptoir</span>
    </div>

    <p style="text-align: center;">
      <a href="https://hoyapoke.fr/tracking" class="btn">Voir les détails</a>
    </p>
  `;

  return baseEmailLayout({
    title: `${isDelivery ? 'Commande en route' : 'Commande prête'} #${order.id} · Hoya Poké`,
    previewText: `${customerName}, votre poké bowl est prêt !`,
    content,
    isMarketing: false
  });
}

/**
 * 3. Email de lien magique (Connexion sans mot de passe)
 */
export function renderMagicLinkEmail({ magicLink, email }) {
  const content = `
    <h2 style="margin-top: 0; color: #1e3325;">Connexion à votre espace Hoya Poké</h2>
    <p>Bonjour,</p>
    <p>Cliquez sur le bouton ci-dessous pour accéder directement à votre compte client, retrouver votre carte de fidélité et vos commandes enregistrées :</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" class="btn">Me connecter en un clic</a>
    </div>

    <p style="font-size: 13px; color: #7a8c80;">
      Ce lien sécurisé est valable pendant 15 minutes et ne peut être utilisé qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande pour l'adresse <strong>${email}</strong>, vous pouvez ignorer cet email en toute sécurité.
    </p>
  `;

  return baseEmailLayout({
    title: 'Votre lien de connexion · Hoya Poké',
    previewText: 'Accédez à votre compte client Hoya Poké en un clic sans mot de passe',
    content,
    isMarketing: false
  });
}

/**
 * 4. Email de bienvenue après création de compte
 */
export function renderWelcomeEmail({ firstName = 'Gourmand(e)', currentStamps = 1 }) {
  const content = `
    <h2 style="margin-top: 0; color: #1e3325;">Bienvenue dans la famille Hoya Poké, ${firstName} ! 🌱</h2>
    <p>Votre compte client est désormais actif. Vous profitez automatiquement de tous vos avantages exclusifs :</p>
    
    <div class="card">
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Carte de fidélité automatique :</strong> 1 bol acheté = 1 tampon.</li>
        <li><strong>Récompense :</strong> Au 10ᵉ tampon, votre 11ᵉ bol est 100% offert !</li>
        <li><strong>Re-commande express :</strong> Recommandez vos bols favoris en 1 seul geste.</li>
        <li><strong>Adresses sauvegardées :</strong> Pour vos commandes en livraison à Pézenas.</li>
      </ul>
    </div>

    <p>Votre solde actuel : <strong>${currentStamps} / 10 tampons</strong>.</p>

    <div style="text-align: center;">
      <a href="https://hoyapoke.fr/compte" class="btn">Accéder à mon espace fidélité</a>
    </div>
  `;

  return baseEmailLayout({
    title: 'Bienvenue chez Hoya Poké ! Carte de fidélité activée',
    previewText: 'Votre compte client et votre carte de fidélité sont prêts !',
    content,
    isMarketing: false
  });
}

/**
 * 5. Email de récompense fidélité disponible (11ᵉ bol offert)
 */
export function renderLoyaltyRewardEmail({ firstName = 'Fidèle client', unsubscribeUrl }) {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 52px;">🎁</span>
      <h2 style="color: #1e3325; margin: 12px 0;">Félicitations ${firstName} ! Votre 11ᵉ bol est offert !</h2>
      <p style="font-size: 16px; color: #2d4d38;">Vous avez complété vos 10 tampons de fidélité chez Hoya Poké Pézenas.</p>
    </div>

    <div class="card" style="text-align: center;">
      <span style="font-size: 13px; text-transform: uppercase; color: #d4a373; font-weight: 800;">Récompense fidélité débloquée</span>
      <div style="font-size: 26px; font-weight: 900; color: #1e3325; margin: 8px 0;">1 Bol Moyen ou Signature Offert</div>
      <p style="font-size: 14px; color: #556b5b; margin: 0;">Valeur de 12,90 € déduite automatiquement lors de votre prochaine commande en ligne ou au comptoir.</p>
    </div>

    <div style="text-align: center;">
      <a href="https://hoyapoke.fr/menu" class="btn">Profiter de mon bol offert</a>
    </div>
  `;

  return baseEmailLayout({
    title: '🎁 Votre 11ᵉ bol est offert chez Hoya Poké !',
    previewText: 'Félicitations ! Votre récompense fidélité est prête à être dégustée.',
    content,
    unsubscribeUrl,
    isMarketing: true
  });
}

/**
 * 6. Email de relance client inactif
 */
export function renderInactiveReminderEmail({ firstName = '', promoCode = 'REVIENS10', unsubscribeUrl }) {
  const content = `
    <h2 style="margin-top: 0; color: #1e3325;">Ça fait longtemps, ${firstName || 'cher client'} ! 🌴</h2>
    <p>Vos pokés bowls préférés vous manquent ? Nos ingrédients frais du jour, marinades maison et sauces artisanales vous attendent à Pézenas.</p>
    
    <div class="card" style="text-align: center;">
      <span style="font-size: 13px; color: #7a8c80; font-weight: 700; text-transform: uppercase;">Votre cadeau de retour</span>
      <div style="font-size: 24px; font-weight: 900; color: #1e3325; margin: 8px 0;">-10% sur votre commande</div>
      <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #d4a373;">Code promo : ${promoCode}</p>
    </div>

    <div style="text-align: center;">
      <a href="https://hoyapoke.fr/menu" class="btn">Composer mon bol maintenant</a>
    </div>
  `;

  return baseEmailLayout({
    title: 'Vous nous manquez chez Hoya Poké ! -10% pour votre retour',
    previewText: 'Profitez de -10% sur votre prochain bol avec le code ' + promoCode,
    content,
    unsubscribeUrl,
    isMarketing: true
  });
}

/**
 * 7. Email de campagne libre (Marketing broadcast)
 */
export function renderMarketingCampaignEmail({ title, bodyText, imageUrl, ctaLabel = 'Découvrir la carte', ctaUrl = 'https://hoyapoke.fr/menu', unsubscribeUrl }) {
  const content = `
    <h2 style="margin-top: 0; color: #1e3325;">${title}</h2>
    ${imageUrl ? `<div style="text-align: center; margin: 18px 0;"><img src="${imageUrl}" alt="${title}" style="max-width: 100%; border-radius: 12px; height: auto;"></div>` : ''}
    <div style="white-space: pre-line; line-height: 1.7;">
      ${bodyText}
    </div>
    <div style="text-align: center; margin-top: 28px;">
      <a href="${ctaUrl}" class="btn">${ctaLabel}</a>
    </div>
  `;

  return baseEmailLayout({
    title,
    previewText: title,
    content,
    unsubscribeUrl,
    isMarketing: true
  });
}
