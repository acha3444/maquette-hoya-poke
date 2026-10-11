import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const PWA_CONFIGS = {
  admin: {
    id: 'admin',
    name: 'Hoya Poké · Administration & Caisse',
    shortName: 'Hoya Admin',
    appleTitle: 'Hoya Admin',
    manifest: '/manifest-admin.json',
    themeColor: '#15221b',
    startUrl: '/admin',
    description: 'Dashboard de gestion : carte, stocks, commandes et clôture de caisse.'
  },
  cuisine: {
    id: 'cuisine',
    name: 'Hoya Poké · Écran Cuisine KDS',
    shortName: 'Hoya Cuisine',
    appleTitle: 'Hoya Cuisine',
    manifest: '/manifest-cuisine.json',
    themeColor: '#0d1712',
    startUrl: '/cuisine',
    description: 'Écran cuisine tactile KDS en temps réel pour la préparation des bowls.'
  },
  livreur: {
    id: 'livreur',
    name: 'Hoya Poké · App Livreur',
    shortName: 'Hoya Livreur',
    appleTitle: 'Hoya Livreur',
    manifest: '/manifest-livreur.json',
    themeColor: '#0f1a14',
    startUrl: '/livreur',
    description: 'Application livreur : suivi des courses, adresses et itinéraires GPS.'
  },
  client: {
    id: 'client',
    name: 'Hoya Poké · Commande en ligne',
    shortName: 'Hoya Poké',
    appleTitle: 'Hoya Poké',
    manifest: '/manifest-client.json',
    themeColor: '#0f1a14',
    startUrl: '/',
    description: 'Commandez vos poké bowls frais à Pézenas. Retrait express et livraison.'
  }
};

export function getCurrentPwaConfig(pathname = window.location.pathname) {
  if (pathname.startsWith('/admin')) return PWA_CONFIGS.admin;
  if (pathname.startsWith('/cuisine')) return PWA_CONFIGS.cuisine;
  if (pathname.startsWith('/livreur')) return PWA_CONFIGS.livreur;
  return PWA_CONFIGS.client;
}

export function usePwaManager() {
  const location = useLocation();

  useEffect(() => {
    const config = getCurrentPwaConfig(location.pathname);

    // 1. Update document title
    document.title = config.name;

    // 2. Update Manifest Link
    let manifestLink = document.getElementById('pwa-manifest-link');
    if (!manifestLink) {
      manifestLink = document.querySelector('link[rel="manifest"]');
    }
    if (manifestLink) {
      manifestLink.setAttribute('href', config.manifest);
    }

    // 3. Update Apple Mobile Web App Title
    let appleTitleMeta = document.getElementById('pwa-apple-title');
    if (!appleTitleMeta) {
      appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    }
    if (appleTitleMeta) {
      appleTitleMeta.setAttribute('content', config.appleTitle);
    }

    // 4. Update Theme Color
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', config.themeColor);
    }
  }, [location.pathname]);
}
