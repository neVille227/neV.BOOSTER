/* neV.BOOSTER — Alimentation et conseils : une seule page, deux parties, un sommaire. Publique. */
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = NEV.util.esc;
  const ctx = await NEV.bootPublic('alimentation');
  const user = ctx.user;
  const A = NEV.Nutri.alim(ctx), C = NEV.Nutri.cons(ctx);

  $('tipC').innerHTML = C.tip;
  $('tipA').innerHTML = A.tip;

  const GROUPS = [
    { id: 'manger', n: '1', name: 'Bien manger', sub: 'Repas, protéines, assiette, menus et calculateur.', S: A.S },
    { id: 'conseils', n: '2', name: 'Récupérer et durer', sub: 'Sommeil, eau, échauffement, mental, sécurité et mythes.', S: C.S }
  ];
  $('toc').innerHTML = GROUPS.map((g) => '<div class="tg"><a class="tgh" href="#' + g.id + '">' + g.n + ' · ' + esc(g.name) + '</a>' +
    g.S.map((s) => '<a href="#' + s.id + '">' + s.ico + ' ' + esc(s.title.length > 26 ? s.title.slice(0, 24) + '…' : s.title) + '</a>').join('') + '</div>').join('');
  $('art').innerHTML = GROUPS.map((g) => '<div class="grp" id="' + g.id + '"><header class="grp-h"><span>Partie ' + g.n + '</span><h2>' + esc(g.name) + '</h2><p>' + esc(g.sub) + '</p></header>' +
    g.S.map((s) => '<section id="' + s.id + '"><h2><span class="ico">' + s.ico + '</span>' + esc(s.title) + '</h2>' + s.html + '</section>').join('') + '</div>').join('') +
    '<div class="cta"><a class="btn" href="tuto.html" data-go>Le tuto du site</a>' + (user ? '<a class="btn ok" href="gacha.html" data-go>Aller au Gacha</a>' : '<a class="btn" href="connexion.html" data-go>Créer mon compte</a>') + '</div>';

  A.after(); C.after();

  const links = Array.from($('toc').querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
    GROUPS.forEach((g) => g.S.forEach((s) => { const el = $(s.id); if (el) io.observe(el); }));
  }
  const h = (location.hash || '').slice(1);
  if (h && $(h)) setTimeout(() => $(h).scrollIntoView(), 120);
})();
