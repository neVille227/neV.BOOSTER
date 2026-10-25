/* ==========================================================
   neV.BOOSTER — i18n.js : site multilingue
   Langues : français (d'origine), anglais, espagnol, portugais, arabe, chinois, hindi.
   Principe : le site est écrit en français ; dans une autre langue, un traducteur remplace les textes
   connus (paquet js/i18n-<langue>.js) dans la page, y compris ceux que les scripts affichent plus tard.
   - Langue : choix gardé sur l'appareil (et sur le compte en mode serveur) ; à la première visite,
     la langue du navigateur est proposée si elle fait partie de la liste, sinon français.
   - Arabe : la page passe en lecture de droite à gauche (dir="rtl").
   - Ne touche jamais au contenu des joueurs (pseudos, messages) : attribut translate="no".
   - Hors périmètre (reste en français) : textes juridiques, bibliothèque d'exercices, programmes,
     conseils, alimentation, tuto, messages d'erreur du serveur.
   - Traductions automatiques de qualité « correcte » : à faire relire par des locuteurs natifs.
   ========================================================== */
(function (g) {
  'use strict';
  const NEV = (g.NEV = g.NEV || {}), doc = g.document, KEY = 'nev.lang';
  const LANGS = { fr: ['Français', 'ltr'], en: ['English', 'ltr'], es: ['Español', 'ltr'], pt: ['Português', 'ltr'], ar: ['العربية', 'rtl'], zh: ['中文', 'ltr'], hi: ['हिन्दी', 'ltr'] };
  const FRDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const FRMONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function pick() {
    let s = null; try { s = g.localStorage.getItem(KEY); } catch (e) { /* ignoré */ }
    if (s && LANGS[s]) return s;
    const nav = String((g.navigator && (g.navigator.language || (g.navigator.languages || [])[0])) || '').slice(0, 2).toLowerCase();
    return LANGS[nav] ? nav : 'fr';
  }
  const lang = pick();
  let P = null; // paquet de la langue courante

  const i18n = NEV.i18n = {
    lang: () => lang, langs: () => Object.keys(LANGS).map((c) => ({ code: c, name: LANGS[c][0] })),
    set(l) {
      l = LANGS[l] ? l : 'fr';
      try { g.localStorage.setItem(KEY, l); } catch (e) { /* ignoré */ }
      try { if (NEV.cloud && NEV.cloud.mode === 'server' && NEV.auth && NEV.auth.current && NEV.auth.current()) NEV.cloud.api('account/lang', 'POST', { lang: l }).catch(() => {}); } catch (e) { /* ignoré */ }
      g.setTimeout(() => g.location.reload(), 80);
    },
    t(s) { return P ? tr(s) : s; }
  };

  /* motifs des textes à chiffres (le français sert de clé) → gabarits du paquet */
  const D = '(\\d+)';
  const PATS = [
    ['date', /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\d+) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)$/],
    ['greet', /^Salut (.+), prêt à$/], ['glasses', new RegExp('^' + D + ' / ' + D + ' verres$')],
    ['xpbefore', new RegExp('^' + D + ' / ' + D + ' XP avant « (.+) »$')], ['card', new RegExp('^Carte ' + D + ' · niveau (.+) · ≈ ' + D + ' min$')],
    ['stagelv', new RegExp('^(.+) · niveau ' + D + '$')], ['level', new RegExp('^Niveau ' + D + '$')],
    ['repsx', new RegExp('^— ' + D + ' × ' + D + ' rép\\.$')], ['perside', new RegExp('^— ' + D + ' × ' + D + ' par côté$')], ['repsn', new RegExp('^Répétitions \\(' + D + ' dernières\\)$')],
    ['wkstreak', new RegExp('^' + D + ' séances? · série ' + D + '$')], ['wkdone', new RegExp('^' + D + ' séances? validées?\\.?$')], ['wk', new RegExp('^' + D + ' séances?$')],
    ['days', new RegExp('^' + D + ' / ' + D + ' jours$')], ['wks', new RegExp('^' + D + ' / ' + D + ' séances$')], ['unit', new RegExp('^' + D + ' / ' + D + ' (répétitions|XP|séances caméra)$')],
    ['xpearned', new RegExp('^' + D + ' XP gagnés$')], ['daysleft', new RegExp('^' + D + ' jours restants$')],
    ['season', /^Saison (\d+|—) · (.+)$/], ['seasonstart', /^La saison 1 commence le (.+)$/], ['chalhead', /^Défi de la semaine · du (\S+) au (\S+)$/],
    ['seasongoal', new RegExp('^Fais ' + D + ' séances pendant la saison \\(six semaines\\) pour gagner ' + D + ' flammes\\.$')], ['claim', new RegExp('^Récupérer \\+' + D + ' flammes$')],
    ['you', /^(.+) \(toi\)$/], ['flamesav', new RegExp('^flammes disponibles · ' + D + ' gagnées au total$')], ['period', /^(Cette semaine|Ce mois|Cette saison) · (.+)$/],
    ['newacct', new RegExp('^Compte tout neuf : le salon s\'ouvre pour toi dans ' + D + ' min\\.$')], ['flames', new RegExp('^' + D + ' flammes$')],
    ['guarantee', new RegExp('^Niveau (\\d) « (.+) »\\. Tirages sans Épique d\'affilée : ' + D + '\\. Garantie Épique\\+ dans ' + D + ' tirages au plus tard\\.$')],
    ['fornow', new RegExp('^pour passer de 5 % à 40 %\\. Pour l\'instant : ' + D + ' jours?, donc$')], ['range', new RegExp('^' + D + ' à ' + D + ' pompes · (.+)$')], ['rangeplus', new RegExp('^' + D + ' pompes et plus · (.+)$')],
    ['dayn', new RegExp('^Jour ' + D + ' / ' + D + '$')], ['streakn', new RegExp('^🔥 ' + D + ' jours de suite$')], ['xptoday', new RegExp('^\\+' + D + ' XP du jour$')],
    ['likes', new RegExp('^♥ J\'aime ' + D + '$')], ['followers', new RegExp('^Abonnés \\+' + D + '$')], ['msgs', new RegExp('^Messages ' + D + '$')]
  ];

  function render(tpl, m) {
    return tpl.replace(/\{(t|wd|mo|p)?(\d)(?:\|([^|}]*)\|([^}]*))?\}/g, (all, kind, n, a, b) => {
      const v = m[Number(n)] || '';
      if (kind === 'p') return Number(v) === 1 ? a : b;
      if (kind === 't') return P.d[v] != null ? P.d[v] : v;
      if (kind === 'wd') return (P.wd && P.wd[FRDAYS.indexOf(v)]) || v;
      if (kind === 'mo') return (P.mo && P.mo[FRMONTHS.indexOf(v)]) || v;
      return v;
    });
  }
  function tr(raw) {
    const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
    if (!core) return raw;
    let out = P.d[core];
    if (out == null) for (let i = 0; i < PATS.length; i++) { const r = PATS[i][1].exec(core); if (r && P.x[PATS[i][0]]) { out = render(P.x[PATS[i][0]], r); break; } }
    return out == null ? raw : m[1] + out + m[3];
  }
  const skip = (n) => { for (let e = n.nodeType === 1 ? n : n.parentElement; e; e = e.parentElement) { if (e.getAttribute && e.getAttribute('translate') === 'no') return true; if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE|SELECT|OPTION)$/.test(e.tagName)) return true; } return false; };
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skip(root)) { const v = tr(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; } return; }
    if (root.nodeType !== 1 || skip(root)) return;
    const w = doc.createTreeWalker(root, 4 | 1, null); let n = root;
    do {
      if (n.nodeType === 3) { if (!skip(n)) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } }
      else if (n.nodeType === 1 && n.getAttribute && !skip(n)) ATTRS.forEach((a) => { const x = n.getAttribute(a); if (x) { const v = tr(x); if (v !== x) n.setAttribute(a, v); } });
    } while ((n = w.nextNode()));
  }
  function legalNote() {
    if (!/\/(conditions|confidentialite|mentions-legales)\.html$/.test(g.location.pathname)) return;
    const w = doc.querySelector('.hero-page') || doc.querySelector('.wrap'); if (!w || doc.getElementById('enLegal')) return;
    const p = doc.createElement('p'); p.id = 'enLegal'; p.className = 'muted'; p.setAttribute('translate', 'no');
    p.textContent = P.legal || ''; if (P.legal) w.appendChild(p);
  }
  function apply() {
    doc.documentElement.lang = lang; doc.documentElement.dir = LANGS[lang][1]; legalNote();
    if (doc.title) doc.title = tr(doc.title);
    walk(doc.body);
    if (g.MutationObserver) new g.MutationObserver((ms) => {
      ms.forEach((m) => { if (m.type === 'characterData') walk(m.target); else if (m.type === 'attributes') { const x = m.target.getAttribute(m.attributeName); if (x) { const v = tr(x); if (v !== x) m.target.setAttribute(m.attributeName, v); } } else m.addedNodes.forEach(walk); });
      if (doc.title) { const t = tr(doc.title); if (t !== doc.title) doc.title = t; }
    }).observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  /* sélecteur de langue (liste déroulante) : ajouté au pied de page dès qu'il existe */
  function switcher() {
    const f = doc.querySelector('.sitefoot nav') || doc.getElementById('langHost'); if (!f || f.querySelector('.langsw')) return;
    const s = doc.createElement('select'); s.className = 'langsw'; s.setAttribute('translate', 'no');
    s.setAttribute('aria-label', 'Langue / Language');
    Object.keys(LANGS).forEach((c) => { const o = doc.createElement('option'); o.value = c; o.textContent = LANGS[c][0]; o.lang = c; if (c === lang) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => i18n.set(s.value)); f.appendChild(s);
  }
  if (g.MutationObserver) new g.MutationObserver(switcher).observe(doc.documentElement, { childList: true, subtree: true });
  doc.addEventListener('DOMContentLoaded', switcher);

  if (lang !== 'fr') {
    const s = doc.createElement('script'); s.src = 'js/i18n-' + lang + '.js';
    s.onload = () => { P = (NEV.i18nPacks || {})[lang]; if (!P) return; const go = () => apply(); if (doc.body) go(); else doc.addEventListener('DOMContentLoaded', go); };
    doc.head.appendChild(s);
    doc.documentElement.dir = LANGS[lang][1];
  }
})(window);
