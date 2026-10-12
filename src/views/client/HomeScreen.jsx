import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ShoppingBag, Bike, ShoppingBasket, Star, MapPin, Clock, AtSign } from 'lucide-react';
import { useStore } from '../../store';
import { MENU, FORMULES, CUSTOMER_REVIEWS } from '../../data';
import { RESTAURANT } from '../../restaurant';
import { formatPrice } from '../../format';
import { ease } from '../../motion';
import HoyaMark from '../../components/brand/HoyaMark';
import Branch from '../../components/brand/Branch';
import BowlArt from '../../components/brand/BowlArt';
import { BowlScene } from '../../components/BowlVisualizer';
import LoyaltyModal from '../../components/LoyaltyModal';
import FormuleModal from '../../components/FormuleModal';
import ClientInstallPrompt from '../../components/ClientInstallPrompt';
import './home.css';

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease }
};

const CARD_TINTS = ['var(--bleuet-soft)', 'var(--gold-soft)', 'var(--lilas-soft)', '#e4ece6'];

const STEPS = [
  { title: 'La base', text: 'Riz vinaigré, quinoa ou carotte râpée' },
  { title: 'Fruits & légumes', text: 'Cinq au choix, découpés le matin même' },
  { title: 'La protéine', text: 'Saumon ou thon marinés, poulet frit, falafels' },
  { title: 'La sauce maison', text: 'De la soja sucrée à la sriracha' },
  { title: 'Le croquant', text: 'Sésames, cacahuètes, oignons frits…' }
];

// A bowl that builds itself, step by step, while the section is on screen
const DEMOS = [
  {
    base: 'Riz vinaigré',
    stages: [
      {},
      { veggies: ['Avocat', 'Mangue'] },
      { veggies: ['Avocat', 'Mangue', 'Chou rouge', 'Concombre', 'Radis rose'] },
      { protein: 'Saumon cru mariné' },
      { sauce: 'Sriracha mayo' },
      { toppings: ['Sésames noirs', 'Oignons frits'] }
    ]
  },
  {
    base: 'Base quinoa',
    stages: [
      {},
      { veggies: ['Edamame', 'Ananas'] },
      { veggies: ['Edamame', 'Ananas', 'Carotte', 'Grenade', 'Concombre'] },
      { protein: 'Falafel maison' },
      { sauce: 'Tzatziki' },
      { toppings: ['Graines de courge', 'Sésames'] }
    ]
  }
];

function DemoBowl() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [tick, setTick] = useState({ demo: 0, stage: reduce ? 5 : 0 });

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const last = tick.stage === 5;
    const t = setTimeout(() => {
      setTick(({ demo, stage }) => (stage === 5 ? { demo: (demo + 1) % DEMOS.length, stage: 0 } : { demo, stage: stage + 1 }));
    }, last ? 3600 : tick.stage === 4 ? 2300 : 1300);
    return () => clearTimeout(t);
  }, [inView, reduce, tick]);

  const demo = DEMOS[tick.demo];
  const state = demo.stages.slice(0, tick.stage + 1).reduce((acc, s) => ({ ...acc, ...s }), {});

  return (
    <div ref={ref} className="h-demo">
      <BowlScene
        className="h-demo-bowl"
        baseName={demo.base}
        veggiesList={state.veggies || []}
        proteinName={state.protein || ''}
        sauceName={state.sauce || ''}
        toppingsList={state.toppings || []}
        isLarge
        label="Démonstration : un bol se compose"
      />
      <ol className="h-demo-steps" aria-hidden="true">
        {STEPS.map((s, i) => <li key={s.title} className={i < tick.stage ? 'on' : ''} />)}
      </ol>
    </div>
  );
}

function StampCard({ stamps }) {
  return (
    <div className="h-stampcard" aria-label={`${stamps} tampons sur 10`}>
      <div className="h-stampcard-text">
        <span>{RESTAURANT.loyalty.reward}</span>
        <small>Suivez-nous sur @{RESTAURANT.instagram}</small>
      </div>
      <div className="h-stampcard-grid">
        {Array.from({ length: RESTAURANT.loyalty.stamps }, (_, i) => (
          <span key={i} className={`h-stamp ${i < stamps ? 'on' : ''}`}>
            {i < stamps && (
              <motion.span
                className="h-stamp-ink"
                initial={{ scale: 1.8, opacity: 0, rotate: -30 }}
                whileInView={{ scale: 1, opacity: 1, rotate: i % 2 ? 4 : -5 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 + i * 0.09, type: 'spring', stiffness: 380, damping: 18 }}
              >
                <HoyaMark size={26} />
              </motion.span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { restaurantOpen, setOrderType, cart, menu: storeMenu, loyaltyStamps } = useStore();
  const menu = storeMenu || MENU;
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [activeFormule, setActiveFormule] = useState(null);
  const [installPromptOpen, setInstallPromptOpen] = useState(false);
  const reduce = useReducedMotion();
  const scrollRef = useRef(null);

  const start = (type) => {
    setOrderType(type);
    navigate('/menu');
  };
  const compose = () => {
    setOrderType(useStore.getState().orderType || 'RETRAIT');
    navigate('/builder', { state: { isCustom: true } });
  };
  const openClassic = (c) => {
    if (!useStore.getState().orderType) setOrderType('RETRAIT');
    navigate('/builder', { state: { baseItem: c } });
  };
  const scrollToInfos = () => document.getElementById('infos')?.scrollIntoView({ behavior: 'smooth' });

  const stamps = Math.min(loyaltyStamps || 0, RESTAURANT.loyalty.stamps);
  const ticker = [...RESTAURANT.promises, ...RESTAURANT.promises];

  return (
    <div className="screen home">
      <header className="h-nav">
        <div className="h-nav-inner">
          <button className="h-brand" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Hoya Poké, accueil">
            <HoyaMark size={26} />
            <span>Hoya Poké</span>
          </button>

          <nav className="h-nav-links" aria-label="Navigation principale">
            <button onClick={() => navigate('/menu')}>La carte</button>
            <button onClick={compose}>Composer</button>
            <button onClick={() => setLoyaltyOpen(true)}>Fidélité</button>
            <button onClick={scrollToInfos}>Infos</button>
          </nav>

          <div className="h-nav-actions">
            <button className="h-cart" onClick={() => navigate('/menu')} aria-label={`Panier, ${cart.length} article${cart.length > 1 ? 's' : ''}`}>
              <ShoppingBasket size={19} />
              {cart.length > 0 && <span className="h-cart-count">{cart.length}</span>}
            </button>
            <button className="h-btn h-btn-forest" onClick={() => start('RETRAIT')}>Commander</button>
          </div>
        </div>
      </header>

      <div className="scroll" ref={scrollRef}>
        {/* ───────── Hero ───────── */}
        <section className="h-hero">
          <Branch className="h-hero-branch" />
          <div className="h-hero-inner">
            <motion.div
              className="h-hero-copy"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
            >
              <span className="h-eyebrow">Spécialité hawaïenne · Pézenas</span>
              <h1 className="h-hero-title">
                Des poké bowls <em>frais & sains</em>, faits minute.
              </h1>
              <p className="h-hero-lead">
                Saumon mariné, poulet croustillant ou falafels maison, des légumes coupés le matin et des sauces faites ici.
                Commandez en ligne : on s'occupe du reste.
              </p>
              <div className="h-hero-ctas">
                <button className="h-btn h-btn-curry h-btn-lg" onClick={() => start('RETRAIT')}>
                  Commander <ArrowRight size={18} />
                </button>
                <button className="h-btn h-btn-outline h-btn-lg" onClick={compose}>Composer mon bol</button>
              </div>
              <ul className="h-hero-meta">
                <li>
                  <span className={`live-dot ${restaurantOpen ? '' : 'off'}`} />
                  {restaurantOpen ? 'Ouvert, prêt en 15 min' : 'Fermé, précommande possible'}
                </li>
                <li><Star size={14} fill="currentColor" /> {RESTAURANT.rating} / 5</li>
                <li>Végé friendly</li>
              </ul>
            </motion.div>

            <motion.div
              className="h-hero-visual"
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease, delay: 0.1 }}
            >
              <div className="h-hero-photo">
                <img src="/hero.jpg" alt="Trois poké bowls Hoya : falafels, saumon et fruit de la passion, saumon et sésame" />
              </div>
              <div className="h-sticker" aria-hidden="true">
                <svg viewBox="0 0 120 120" className="h-sticker-ring">
                  <defs>
                    <path id="h-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
                  </defs>
                  <text textLength="272" lengthAdjust="spacing">
                    <textPath href="#h-ring" textLength="272" lengthAdjust="spacing">POKÉ BOWLS & COFFEE · HEALTHY FOOD ·</textPath>
                  </text>
                </svg>
                <HoyaMark size={34} className="h-sticker-mark" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ───────── Ticker, like the shop window ───────── */}
        <div className="h-ticker" aria-label={RESTAURANT.promises.join(', ')}>
          <div className="h-ticker-track" aria-hidden="true">
            {ticker.map((p, i) => (
              <span key={i}>{p}<HoyaMark size={16} strokeWidth={12} /></span>
            ))}
          </div>
        </div>

        {/* ───────── Order mode ───────── */}
        <section className="h-section">
          <div className="h-modes">
            <motion.button className="h-mode" onClick={() => start('RETRAIT')} {...reveal}>
              <span className="h-mode-icon" style={{ background: 'var(--bleuet-soft)' }}><ShoppingBag size={22} /></span>
              <span className="h-mode-text">
                <strong>À emporter</strong>
                <span>Prêt en 15 min au {RESTAURANT.street}</span>
              </span>
              <ArrowUpRight size={20} className="h-mode-arrow" />
            </motion.button>
            <motion.button className="h-mode" onClick={() => start('LIVRAISON')} {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}>
              <span className="h-mode-icon" style={{ background: 'var(--lilas-soft)' }}><Bike size={22} /></span>
              <span className="h-mode-text">
                <strong>Livraison</strong>
                <span>Chez vous, à Pézenas et alentours</span>
              </span>
              <ArrowUpRight size={20} className="h-mode-arrow" />
            </motion.button>
          </div>
        </section>

        {/* ───────── Classics ───────── */}
        <section className="h-section">
          <motion.div className="h-head" {...reveal}>
            <div>
              <span className="h-eyebrow dark">La carte</span>
              <h2 className="h-title">Les classiques</h2>
              <p className="h-lead">Riz vinaigré, carotte, concombre, edamame, avocat et sésame. Il ne reste qu'à choisir la protéine.</p>
            </div>
            <button className="h-link" onClick={() => navigate('/menu')}>Toute la carte <ArrowRight size={16} /></button>
          </motion.div>

          <div className="h-classics">
            {(menu.classiques || []).map((c, i) => (
              <motion.button
                key={c.id}
                className="h-classic"
                onClick={() => openClassic(c)}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.07 }}
              >
                <span className="h-classic-art" style={{ background: CARD_TINTS[i % CARD_TINTS.length] }}>
                  <BowlArt item={c} />
                </span>
                <span className="h-classic-body">
                  <span className="h-classic-name">{c.name}</span>
                  <span className="h-classic-desc">{c.description}</span>
                  <span className="h-classic-foot">
                    <span className="price">dès {formatPrice(c.priceM)}</span>
                    <span className="h-classic-go" aria-hidden="true"><ArrowRight size={16} /></span>
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ───────── Sur mesure ───────── */}
        <section className="h-section">
          <div className="h-custom">
            <motion.div className="h-custom-copy" {...reveal}>
              <span className="h-eyebrow">Le sur mesure · dès {formatPrice(menu.surMesureBase?.priceM || 12.9)}</span>
              <h2 className="h-title light">Votre bol, ingrédient par ingrédient.</h2>
              <ol className="h-steps">
                {STEPS.map((s, i) => (
                  <li key={s.title}>
                    <span className="h-step-num">{i + 1}</span>
                    <span>
                      <strong>{s.title}</strong>
                      <span>{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <button className="h-btn h-btn-curry h-btn-lg" onClick={compose}>
                Composer mon bol <ArrowRight size={18} />
              </button>
            </motion.div>
            <DemoBowl />
          </div>
        </section>

        {/* ───────── Formules ───────── */}
        <section className="h-section">
          <motion.div className="h-head" {...reveal}>
            <div>
              <span className="h-eyebrow dark">Le midi</span>
              <h2 className="h-title">Les formules</h2>
            </div>
          </motion.div>
          <div className="h-formules">
            {FORMULES.map((f, i) => (
              <motion.button
                key={f.id}
                className="h-formule"
                onClick={() => {
                  if (!useStore.getState().orderType) setOrderType('RETRAIT');
                  setActiveFormule(f);
                }}
                {...reveal}
                transition={{ ...reveal.transition, delay: i * 0.06 }}
              >
                <span className="h-formule-badge">{f.badge}</span>
                <span className="h-formule-name">{f.name.replace(/\s*\(.*\)$/, '')}</span>
                <span className="h-formule-incl">{(f.includes || []).join(' + ')}</span>
                <span className="h-formule-foot">
                  <span className="price">dès {formatPrice(f.priceM)}</span>
                  <span className="h-link small">Choisir <ArrowRight size={14} /></span>
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ───────── Loyalty: the real stamp card ───────── */}
        <section className="h-section">
          <div className="h-loyalty">
            <motion.div className="h-loyalty-copy" {...reveal}>
              <span className="h-eyebrow dark">Carte de fidélité</span>
              <h2 className="h-title">{RESTAURANT.loyalty.reward}.</h2>
              <p className="h-lead">
                Un tampon par bol. Au dixième, le suivant est pour nous. Votre carte vous suit en ligne comme au comptoir.
              </p>
              <button className="h-btn h-btn-forest" onClick={() => setLoyaltyOpen(true)}>
                Voir ma carte · {stamps}/{RESTAURANT.loyalty.stamps}
              </button>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
              <StampCard stamps={stamps} />
            </motion.div>
          </div>
        </section>

        {/* ───────── Reviews ───────── */}
        <section className="h-section">
          <motion.div className="h-reviews-head" {...reveal}>
            <span className="h-rating">{RESTAURANT.rating}</span>
            <span className="h-stars" aria-label={`${RESTAURANT.rating} sur 5`}>
              {[0, 1, 2, 3, 4].map(i => <Star key={i} size={22} fill="currentColor" strokeWidth={0} />)}
            </span>
            <p className="h-lead">Merci pour votre fidélité, votre gentillesse et votre patience aussi.</p>
          </motion.div>
          <div className="h-reviews">
            {CUSTOMER_REVIEWS.map((r, i) => (
              <motion.figure key={r.id} className="h-review" {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
                <blockquote>{r.comment}</blockquote>
                <figcaption>
                  <strong>{r.author}</strong>
                  <span>{r.city} · {r.date}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </section>

        {/* ───────── Infos ───────── */}
        <section className="h-section" id="infos">
          <motion.div className="h-infos" {...reveal}>
            <div className="h-info">
              <MapPin size={20} />
              <h3>Nous trouver</h3>
              <p>{RESTAURANT.street}<br />{RESTAURANT.city}</p>
              <span className="h-info-note">Sur place ou à emporter</span>
              <a className="h-link" href={RESTAURANT.mapsUrl} target="_blank" rel="noreferrer">Itinéraire <ArrowUpRight size={15} /></a>
            </div>
            <div className="h-info">
              <Clock size={20} />
              <h3>Horaires</h3>
              <p>{RESTAURANT.days}</p>
              <dl className="h-hours">
                {RESTAURANT.services.map(s => (
                  <div key={s.label}><dt>{s.label}</dt><dd>{s.hours}</dd></div>
                ))}
              </dl>
              <span className="h-info-note">{RESTAURANT.closed}</span>
            </div>
            <div className="h-info">
              <AtSign size={20} />
              <h3>Instagram</h3>
              <p>Les bols du jour, les desserts du moment et les nouveautés.</p>
              <a className="h-link" href={RESTAURANT.instagramUrl} target="_blank" rel="noreferrer">@{RESTAURANT.instagram} <ArrowUpRight size={15} /></a>
            </div>
          </motion.div>
        </section>

        {/* ───────── Footer ───────── */}
        <footer className="h-footer">
          <Branch className="h-footer-branch" />
          <div className="h-footer-inner">
            <div className="h-footer-cols">
              <div>
                <h4>Commander</h4>
                <button onClick={() => start('RETRAIT')}>À emporter</button>
                <button onClick={() => start('LIVRAISON')}>Livraison</button>
                <button onClick={compose}>Composer son poké</button>
                <button onClick={() => navigate('/tracking')}>Suivre ma commande</button>
              </div>
              <div>
                <h4>Le restaurant</h4>
                <span>{RESTAURANT.street}, {RESTAURANT.city}</span>
                <span>{RESTAURANT.days}</span>
                {RESTAURANT.services.map(s => <span key={s.label}>{s.hours}</span>)}
              </div>
              <div>
                <h4>Suivre</h4>
                <a href={RESTAURANT.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
                <button onClick={() => setInstallPromptOpen(true)}>Installer l'application</button>
              </div>
              <div>
                <h4>Équipe</h4>
                <button onClick={() => navigate('/cuisine')}>Écran cuisine</button>
                <button onClick={() => navigate('/livreur')}>Livreurs</button>
                <button onClick={() => navigate('/admin')}>Administration</button>
              </div>
            </div>
            <div className="h-footer-word" aria-hidden="true">
              <span>Hoya</span><HoyaMark size={72} strokeWidth={11} /><span>Poké</span>
            </div>
            <div className="h-footer-bottom">
              <span>© {new Date().getFullYear()} Hoya Poké · Pézenas</span>
              <span>Depuis {RESTAURANT.since}</span>
            </div>
          </div>
        </footer>
      </div>

      <LoyaltyModal isOpen={loyaltyOpen} onClose={() => setLoyaltyOpen(false)} />
      <FormuleModal formule={activeFormule} isOpen={!!activeFormule} onClose={() => setActiveFormule(null)} />
      <ClientInstallPrompt forceOpen={installPromptOpen} onOpenChange={setInstallPromptOpen} />
    </div>
  );
}
