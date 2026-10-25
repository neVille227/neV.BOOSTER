/* ==========================================================
   neV.BOOSTER — js/policy.js
   Règles communes au site ET au serveur (même fichier : une seule source de vérité) :
   filtre du chat, défi de la semaine, saisons, plafonds anti-triche.
   Fonctionne dans le navigateur (NEV.Policy) et dans Node (require).
   ========================================================== */
(function (root, factory) {
  const P = factory();
  if (typeof module === 'object' && module.exports) module.exports = P;
  else { root.NEV = root.NEV || {}; root.NEV.Policy = P; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const TERMS_VERSION = '2026-10-19';

  /* ---------- dates ---------- */
  const dayMs = 86400000;
  const toMs = (s) => Date.parse(s + 'T00:00:00Z');
  const addDays = (s, n) => new Date(toMs(s) + n * dayMs).toISOString().slice(0, 10);
  const diffDays = (a, b) => Math.round((toMs(b) - toMs(a)) / dayMs);
  const weekStart = (day) => { const dow = (new Date(toMs(day)).getUTCDay() + 6) % 7; return addDays(day, -dow); }; // lundi
  const monthStart = (day) => day.slice(0, 8) + '01';
  // Identifiant de semaine = date de son lundi (ex. « 2026-10-19 »)
  const weekId = (day) => weekStart(day);

  /* ---------- saisons de cartes ---------- */
  const SEASON_EPOCH = '2026-10-19', SEASON_DAYS = 42;
  const SEASON_NAMES = ['Braise', 'Acier', 'Tempête', 'Glace', 'Aurore', 'Éclipse', 'Foudre', 'Phénix'];
  function seasonOf(day) {
    const d = diffDays(SEASON_EPOCH, day);
    const n = d < 0 ? 0 : Math.floor(d / SEASON_DAYS) + 1;
    if (n === 0) return { n: 0, id: 'S0', name: 'Préparation', start: addDays(SEASON_EPOCH, -SEASON_DAYS), end: addDays(SEASON_EPOCH, -1), left: Math.max(0, -d) };
    const start = addDays(SEASON_EPOCH, (n - 1) * SEASON_DAYS), end = addDays(start, SEASON_DAYS - 1);
    return { n, id: 'S' + n, name: SEASON_NAMES[(n - 1) % SEASON_NAMES.length], start, end, left: diffDays(day, end) + 1 };
  }
  const SEASON_REWARD = { sessions: 15, flames: 150 };

  /* ---------- défi de la semaine ---------- */
  // metric : sessions | days | reps | xp | verified (calculés côté serveur depuis le journal des séances)
  const CHALLENGES = [
    { id: 'sessions5', title: '5 séances dans la semaine', metric: 'sessions', goal: 5, reward: 60 },
    { id: 'days4', title: 'T\'entraîner 4 jours différents', metric: 'days', goal: 4, reward: 50 },
    { id: 'reps300', title: 'Cumuler 300 répétitions', metric: 'reps', goal: 300, reward: 60 },
    { id: 'xp600', title: 'Gagner 600 XP', metric: 'xp', goal: 600, reward: 70 },
    { id: 'verified3', title: '3 séances validées par la caméra', metric: 'verified', goal: 3, reward: 80 }
  ];
  function challengeFor(day) {
    const w = weekId(day), k = Math.floor(diffDays('2026-01-05', w) / 7);
    const c = CHALLENGES[((k % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length];
    return Object.assign({ week: w, start: w, end: addDays(w, 6) }, c);
  }

  /* ---------- plafonds anti-triche (jour = date UTC du serveur) ---------- */
  const CAPS = { XP_DAY: 1000, SESSIONS_DAY: 12, FLAMES_DAY: 400, STREAK_STEP: 1, FUTURE_DAYS: 1 };

  /* ---------- filtre du chat ---------- */
  const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '€': 'e' };
  function norm(t) {
    let s = strip(String(t).toLowerCase()).replace(/[01345 7@$!€]/g, (c) => (c === ' ' ? ' ' : LEET[c] || c));
    return s.replace(/(.)\1{2,}/g, '$1$1');
  }
  // mots interdits : insultes, haine, harcèlement. Comparés mot entier (avec « s » final) après normalisation.
  const BAD_WORDS = ['con', 'conne', 'connard', 'connasse', 'salope', 'salaud', 'pute', 'putain', 'enculé', 'encule', 'enculer', 'nique', 'niquer', 'ntm', 'fdp', 'tg', 'batard', 'merde',
    'pd', 'pedale', 'tapette', 'gouine', 'negre', 'negro', 'bougnoul', 'bougnoule', 'youpin', 'bicot', 'chinetoque', 'abruti', 'debile', 'mongol', 'taré', 'tare', 'cretin', 'creve', 'kys',
    'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut', 'cunt'];
  // mots longs et sans équivoque : repérés même collés ou séparés par des signes
  const BAD_FLAT = ['connard', 'connasse', 'salope', 'enculer', 'enculé', 'encule', 'nigger', 'faggot', 'bougnoul', 'youpin', 'chinetoque', 'fuckyou', 'tamere', 'tagueule', 'tuetoi', 'vatefaire', 'nazi'];
  const PLATFORMS = ['snap', 'snapchat', 'insta', 'instagram', 'whatsapp', 'telegram', 'discord', 'tiktok', 'skype', 'kik', 'messenger', 'facebook', 'onlyfans'];
  const BAD_SET = new Set(BAD_WORDS.map((w) => norm(w))), PLAT_SET = new Set(PLATFORMS);
  const REASONS = {
    link: 'Les liens ne sont pas autorisés dans le chat.',
    email: 'Ne partage pas d\'adresse e-mail dans le chat.',
    phone: 'Ne partage pas de numéro de téléphone dans le chat.',
    contact: 'Pas de contacts externes : reste sur le chat du site.',
    bad: 'Ce message contient des mots interdits. Reste respectueux.',
    spam: 'Message trop répétitif ou en majuscules.',
    empty: 'Écris un message.'
  };
  function moderate(text) {
    const raw = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if (!raw) return { ok: false, reason: 'empty', error: REASONS.empty };
    const low = strip(raw.toLowerCase());
    const no = (r) => ({ ok: false, reason: r, error: REASONS[r] });
    if (/[^\s@]+\s?(@|\(at\)|\[at\]|arobase)\s?[^\s@]+\s?(\.|\(dot\)|point)\s?[a-z]{2,}/.test(low)) return no('email');
    if (/(https?:\/\/|www\.|\bhttp\b)/.test(low) || /\b[a-z0-9-]{2,}\s?(\.|\(dot\)|\[dot\]|\spoint\s)\s?(com|fr|net|org|io|me|ly|gg|tv|co|app|xyz|bj|be|ch|ca|info|link|site|shop)\b/.test(low)) return no('link');
    const nums = low.match(/\+?\d[\d\s().\-]{6,}\d/g) || [];
    if (nums.some((n) => n.replace(/\D/g, '').length >= 8)) return no('phone');
    const n = norm(raw), words = n.split(/[^a-z0-9]+/).filter(Boolean);
    if (words.some((w) => BAD_SET.has(w) || (w.length > 3 && w.slice(-1) === 's' && BAD_SET.has(w.slice(0, -1))))) return no('bad');
    const flat = n.replace(/[^a-z]/g, '');
    if (BAD_FLAT.some((w) => flat.indexOf(norm(w).replace(/[^a-z]/g, '')) >= 0)) return no('bad');
    if (words.some((w) => PLAT_SET.has(w)) || /(^|\s)@[a-z0-9_.]{3,}/.test(low)) return no('contact');
    const letters = raw.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (/(.)\1{7,}/.test(raw) || (letters.length > 40 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > 0.75)) return no('spam');
    return { ok: true, text: raw };
  }

  return { TERMS_VERSION, dayMs, addDays, diffDays, weekStart, monthStart, weekId, seasonOf, SEASON_REWARD, SEASON_NAMES, CHALLENGES, challengeFor, CAPS, moderate, REASONS };
});
