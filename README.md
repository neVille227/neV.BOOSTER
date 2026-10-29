# neV.BOOSTER — le gacha fitness

> Une carte par jour. Un corps entier à construire.

**neV.BOOSTER** est un site de musculation quotidienne à la maison, construit comme un jeu de cartes (gacha) : chaque jour, un doigt musclé choisit une carte parmi cinq, la carte tourne ×8, explose et révèle ton exercice. Trois secondes plus tard, la séance démarre devant la caméra, qui compte tes répétitions et confirme la bonne position par un « OK » entièrement vert.

Contact et suggestions : **nevlarchitecteopere@gmail.com**

---

## 1. Ce qui est dans le dossier

| Élément | Rôle |
|---|---|
| `index.html` + `intro.*` | Intro animée (logo nVB), bouton **GO**, fondu flou vers la connexion |
| `connexion.html`, `niveau.html` | Compte (e-mail, code de parrainage, acceptation des conditions), question « ton maximum de pompes ? » (1–200), matériel disponible, réglages du gacha |
| `accueil.html` | Carte du jour, héros animé, séries, accès rapides |
| `gacha.html` | Le tirage quotidien (une seule carte) + mode **Spécialisation** (`?mode=spe&zone=…`) |
| `exercice.html` | La séance : brief, caméra (MediaPipe), compteur de répétitions, repos, « OK » vert, résultat |
| `quete.html` | Objectifs du jour (+2 flammes), combo suggéré, calendrier de 28 jours, chiffres, prochains badges |
| `specialisation.html` | 16 zones du corps, 48 combos, gacha ciblé, matériel vérifié |
| `bibliotheque.html` | 112 cartes d'exercices, filtres, mélange aléatoire, fiche détaillée animée |
| `programmes.html` | Tes 25 cartes d'entraînement (5 niveaux × 5), lançables d'un clic |
| `conseils.html` | Sommeil (calculateur de coucher), eau, lait, récupération, échauffement, mythes, FAQ |
| `alimentation.html` | Pourquoi on a faim et sommeil, 71 aliments locaux, calculateur de besoins, assiette, menu au hasard |
| `recompenses.html` | Flammes, parrainage (code + lien + WhatsApp), boutique d'auras, mur de 27 badges |
| `chat.html` | Salon public + conversation privée avec le coach |
| `tuto.html` | Vidéo, visite en 6 étapes, règles, caméra, FAQ, glossaire |
| `admin/` | Espace admin : tableau de bord, **suivi du site**, **base de données**, joueurs, créateur de combos, créateur de badges, annonce, chat |
| `server/server.js` | Serveur Node.js **sans dépendance** : sert le site + API sécurisée |
| `server/store.js` | **La base de données SQLite** (tables, requêtes, sauvegardes, outils admin) |
| `server/data/` | Créé au premier lancement : `nev.db` (toutes les données), `auth.db` (mots de passe, sessions), `backups/` |
| `server/test.js` | 131 tests automatiques : API, sécurité, base de données, redémarrage, migration |
| `img/banner.png` | Bannière du site (1500 × 500) |
| `media/neVBOOSTER-video.mp4` | Vidéo de présentation, 85 s, avec bande-son motivante (136 BPM, montée, drops, impacts calés sur les scènes) ; générateur : `_dev/music2.py` |
| `vendor/mediapipe` | Détection de pose (hors ligne, rien n'est envoyé à Google) |
| `_dev/build_autonome.py` | Fabrique la version autonome (une seule page = tout dedans) pour les hébergeurs statiques |
| `_dev/`, `_original/` | Outils de test, générateurs (bannière, vidéo, musique) et tes tout premiers fichiers |

---

> **Publier comme application téléchargeable : voir `PUBLIER-EN-APPLI.md`.**

## 2. Lancer le site

### Option A — Démo locale (rien à installer)
Ouvre `index.html` via un petit serveur local (la caméra exige `https` ou `localhost`) :

```bash
python3 -m http.server 8765      # puis ouvre http://localhost:8765
```

Mode **démo** : tout est enregistré dans le navigateur. Les comptes ne sont pas partagés entre appareils. Au premier passage dans `/admin/`, tu choisis ton mot de passe admin.

### Option A2 — Hébergement statique simple (Netlify, GitHub Pages, hébergeur gratuit…)
Si ton hébergeur n'envoie pas les sous-dossiers (`css/`, `js/`, `img/`), les pages s'affichent **sans style ni animation** (page blanche avec formulaire brut). Utilise alors la **version autonome** : `neV-BOOSTER-site-autonome.zip`. Chaque page contient déjà son style et son code ; il suffit d'envoyer les fichiers `.html` à la racine. Les dossiers `vendor` (caméra) et `media` (vidéo) sont facultatifs. Ouvre ensuite `ton-site/verifier.html` : chaque fichier est testé (✅ / ❌). Le site est alors en mode démo (données dans le navigateur de chaque visiteur). Pour la régénérer après une modification : `python3 _dev/build_autonome.py sortie/`.

### Option B — Vrai site multi-utilisateurs (recommandé)
Il faut **Node.js 22.13 ou plus récent** (la base SQLite est intégrée à Node : aucun `npm install`, rien d'autre à installer) :

```bash
NEV_ADMIN_PASSWORD="un-mot-de-passe-long-et-unique" NEV_SECURE=1 node server/server.js
# http://localhost:8080  — admin : http://localhost:8080/admin/
```

Variables : `PORT` (8080), `HOST`, `NEV_ADMIN_PASSWORD` (≥ 10 caractères ; sinon un mot de passe est généré et affiché une seule fois), `NEV_SECURE=1` (derrière https : cookies `Secure` + HSTS), `NEV_TRUST_PROXY=1` (derrière un proxy : lit `X-Forwarded-For`), `NEV_DATA` (dossier des données : `nev.db`, `auth.db`, `backups/`).

Le site détecte tout seul le serveur (`/api/health`) et passe en **mode serveur** : comptes, progression, chat, combos, badges et suivi sont alors enregistrés dans la **base de données SQLite** et partagés entre tous les joueurs. Si tu as déjà un ancien `server/data/db.json` (première version), il est importé automatiquement au premier lancement.

**Hébergement** : n'importe quel hébergeur Node 22+ (VPS, Render, Railway, Fly.io…). Mets-le **derrière https** (obligatoire pour la caméra), avec `NEV_SECURE=1` et `NEV_TRUST_PROXY=1`, et un **disque persistant** pour `server/data/` (sans disque persistant, la base disparaît à chaque redéploiement).

---

## 3. La base de données

Une vraie base **SQLite** stocke tout ce que font les joueurs. Elle est visible, interrogeable et exportable depuis **/admin/ → 🗄️ Base de données**.

| Table | Ce qu'elle contient |
|---|---|
| `users` | Comptes : e-mail, pseudo, code de parrainage, parrain, suspension, dernière connexion |
| `players` | Progression (niveau, XP, séries, flammes…) + sauvegarde complète du joueur en JSON |
| `workouts` | **Journal permanent** de toutes les séances (une ligne par carte jouée, jamais en double) |
| `logins` | Jours de connexion de chaque joueur |
| `badge_grants` / `badge_defs` | Badges obtenus ou offerts / badges créés dans l'admin |
| `combos` | Combos du coach |
| `chat_messages` | Salon public et conversations privées |
| `events` | Journal de suivi (pages vues, erreurs, connexions…) |
| `meta` | Réglages (annonce) |
| `admin_audit` | Journal des actions de l'admin (connexions, exports, sauvegardes, requêtes, suppressions) |
| vues `referrals`, `v_joueurs` | Qui a parrainé qui · un joueur par ligne avec ses chiffres clés |

**Dans l'admin** :
- **Tables** : parcourir, chercher dans toutes les colonnes, trier, paginer, ouvrir une ligne en entier, export CSV/JSON.
- **Fiche joueur** : tout ce que la base sait d'un joueur (compte, progression, matériel, badges, amis, séances, connexions, messages), export de la fiche, suppression complète du joueur et de ses données.
- **Console SQL** : requêtes `SELECT` en lecture seule (exemples fournis : joueurs les plus actifs, séances par jour, inscriptions, inactifs…).
- **Export & sauvegardes** : export de toute la base, sauvegarde `.db` téléchargeable, sauvegarde automatique **chaque jour** (7 conservées dans `server/data/backups/`), contrôle d'intégrité.

**Deux fichiers séparés** : `nev.db` (les données) et `auth.db` (mots de passe hachés, sessions, mot de passe admin). L'admin ne peut **jamais** lire `auth.db` : ni la console, ni les exports, ni les sauvegardes téléchargeables n'y touchent. Les sessions étant dans `auth.db`, les joueurs restent connectés après un redémarrage du serveur.

**Restaurer** : arrête le serveur, remplace `server/data/nev.db` par une sauvegarde, relance.

**Mode démo** (sans serveur) : l'onglet affiche la « base » de **ton navigateur** (mêmes tables, lecture et export seulement, pas de console SQL).

> Ces fichiers contiennent des données personnelles (e-mails, pseudos, séances, messages). Protège le disque et les sauvegardes, ne les partage pas, et pense à le dire dans ta politique de confidentialité.

---

## 4. Les règles du jeu

- **5 cartes, 1 seule par jour**, tirée par un générateur aléatoire sécurisé (`crypto.getRandomValues`).
- **Raretés** : Commun (N), Rare (R), Épique (SR), Légendaire (UR), Mythique (MR). Les probabilités dépendent du niveau (1–5, selon le maximum de pompes). Pitié douce à 4 tirages, certaine au 7ᵉ. Il n'y a **plus de système d'âge** : toutes les raretés peuvent sortir pour tout le monde.
- **Jour manqué** : le lendemain, les séries sont **doublées**.
- **Cartes spéciales** (très rares) : **Repos** (récupération guidée) et **Tractions** (seulement avec une barre ou une table solide ; avec 10 pompes max → 5 tractions). Chance de 5 % ; **40 %** si le joueur s'est entraîné au moins 4 jours sur les 7 derniers.
- **XP** : selon la rareté ; ×1,5 après un jour manqué ; ÷2 sans caméra. Le héros évolue en 6 paliers : Maigrichon (0), Éveillé (100), Athlète (300), Costaud (700), Colosse (1400), Légende (2600).
- **Flammes** : +1 par jour de connexion, +4 tous les 7 jours, +10 tous les 30 jours, +2 pour les objectifs du jour. **Parrainage** : +50 pour le parrain, +20 de bienvenue pour l'ami. Les flammes achètent des **auras** pour le héros.
- **Badges** : 27 badges de base + tous ceux que tu crées dans l'admin (règles : série, séances, XP, connexions, parrainages, rareté, collection, caméra, pompes, flammes, ou offert à la main).

---

## 5. Sécurité (ce qui est réellement en place)

Côté serveur (`server/server.js`) :
- Mots de passe hachés avec **scrypt** (sel unique), stockés **dans un fichier séparé** (`auth.db`) ; jamais renvoyés au navigateur ; même durée et même message d'erreur que le compte existe ou non.
- Sessions par **jeton aléatoire de 256 bits**, stocké haché, cookie **HttpOnly + SameSite=Strict (+ Secure sous https)**. Session admin séparée, 2 h.
- **Anti-CSRF** : en-tête personnalisé obligatoire + contrôle de l'origine.
- **Limitation de débit** : inscription, connexion (par IP et par compte), admin (5 essais / 15 min), chat, sauvegardes, requêtes générales. Blocages comptés dans le suivi.
- **En-têtes** : Content-Security-Policy stricte (`script-src 'self' 'wasm-unsafe-eval'`, pas de script inline), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy (caméra seulement pour le site), COOP/CORP, HSTS.
- **Validation de toutes les entrées**, limites de taille, nettoyage des clés dangereuses (`__proto__`…), texte du chat nettoyé (sans balises).
- **Anti-triche serveur** : XP, séances, flammes, série et dates sont **plafonnés par jour UTC** (1000 XP, 12 séances, 400 flammes ; série +1 par jour ; pas de date dans le futur). Les entrées impossibles sont écartées et notées (onglet « Triche » de l'admin) ; un compte très signalé disparaît des classements. Parrainage et badges offerts sont **décidés par le serveur**.
- **Fichiers protégés** : `server/`, données, `_dev/`, `package.json`, fichiers cachés, traversée de dossiers → 404. Seules les extensions connues sont servies.
- Suspension de comptes, journal d'événements, alertes dans le suivi (erreurs JavaScript, connexions refusées, requêtes bloquées).
- Base de données : requêtes SQL **préparées** partout (pas d'injection), noms de tables et colonnes vérifiés dans une liste, console SQL en **lecture seule** sur une connexion séparée (une seule requête, mots dangereux refusés), exports CSV protégés contre l'injection de formules Excel, **journal d'audit** de toutes les actions sensibles de l'admin.

Côté site : aucun `eval`, aucun script inline, toutes les données affichées sont échappées, l'image de la caméra reste dans le navigateur.

Vérifier : `node server/test.js` (189 contrôles).

> **Honnêteté** : aucune sécurité n'est « maximale » à 100 %. Voir la section 7 pour ce qui reste à faire.

---

## 6. Personnaliser sans coder

Dans `/admin/` :
- **Combos** : choisis des exercices dans la bibliothèque, règle les séries, publie → ils apparaissent dans la Quête.
- **Badges** : forme, icône, couleurs, règle de déblocage, aperçu en direct ; offre-les à un joueur.
- **Annonce** : un bandeau en haut du site.
- **Chat** : réponds en privé ou modère le salon public.
- **Suivi du site** : état du serveur, mémoire, requêtes, alertes, journal filtrable.

Dans le code : exercices dans `js/ex-data.js` et `js/ex-more.js` (animations dans `js/ex-anim.js`), zones dans `js/zones.js`, programmes dans `js/programmes.js`, aliments dans `js/foods.js`.

---

## 7. Ce qui reste à faire (et que seul un humain peut faire)

**Fait dans cette version** : pages légales (conditions, confidentialité, mentions légales) + case d'acceptation ; récupération du mot de passe et vérification d'e-mail ; sauvegardes quotidiennes + vraie base SQLite ; outil de relecture des exercices par un pro ; modération du chat ; polices hébergées ; anti-triche serveur ; appli installable (PWA) + hors ligne + rappel facultatif ; audit d'accessibilité (axe : 0 erreur sur 21 pages) ; classement entre amis, défi de la semaine, saisons ; version anglaise du parcours principal ; héros et histoire en 3D (three.js hébergé) ; **âge supprimé** (le système bloquait certains tirages).

**À faire par toi, avant d'ouvrir au public**
1. **Faire relire les textes juridiques par un juriste** (les informations de l'éditeur sont déjà renseignées : HOSSOU DODO Neville, Abomey-Calavi, hébergeur Render ; à confirmer sur render.com). Les textes sont un modèle sérieux, pas un avis juridique.
2. **Formalités APDP (Bénin)** : déclaration / autorisation du traitement de données personnelles auprès de l'Autorité de protection des données personnelles. À faire avant de collecter des comptes réels.
3. **Brancher l'envoi d'e-mails** : variables `NEV_SMTP_HOST`, `NEV_SMTP_PORT`, `NEV_SMTP_USER`, `NEV_SMTP_PASS`, `NEV_SMTP_FROM` **et `NEV_BASE_URL`** (adresse publique du site, obligatoire pour que les liens soient sûrs). Sans cela, les e-mails restent dans l'onglet « Courriels » de l'admin avec leur lien.
4. **Faire relire les exercices** (surtout tractions) par un coach ou un kinésithérapeute, dans l'onglet « Relecture » de l'admin : le badge « Relu par un pro » n'apparaît que sur ce que tu valides.
5. **Tester la caméra avec de vraies personnes** (plusieurs téléphones, lumières, tailles) : ici elle n'a été validée qu'avec une caméra simulée.
6. **Copier les sauvegardes hors du serveur** (`server/data/backups/`), et au-delà de quelques dizaines de milliers de joueurs passer à PostgreSQL.
7. **Retirer l'âge change la protection des mineurs** : il n'y a plus de plafond de rareté ni de filtre par âge. La case « si je suis mineur, j'ai l'accord d'un parent » reste dans les conditions ; vérifie avec ton juriste que cela suffit pour ton pays.

**Variables du chat** : `NEV_CHAT_NEW_MINUTES` (défaut 10 : un compte neuf attend avant d'écrire en public), `NEV_CHAT_SLOW_HOURS` (défaut 24 : 1 message / 45 s pour les comptes récents). Le salon public exige un e-mail confirmé seulement quand l'envoi d'e-mails est branché.

**Pour aller plus loin** : monétisation (suivi des inscriptions éligibles, partenaires, publicité, boutique FedaPay : ne jamais mettre de clé secrète de paiement dans le navigateur), vraie notification push (demande un service d'envoi), traduction anglaise des pages longues (bibliothèque, conseils, alimentation, tuto, textes légaux), style de figures plus proche de ta référence si tu me donnes des images.

---

## 7 bis. Nouveautés de cette version

| Fonction | Où |
|---|---|
| Pages légales + case « J'accepte » | `conditions.html`, `confidentialite.html`, `mentions-legales.html` |
| Mot de passe oublié, vérification e-mail | `mot-de-passe.html`, `verifier-email.html`, `server/mail.js` |
| Mon compte : infos, export JSON, suppression, classement public, appli et rappel | `compte.html` |
| Classement entre amis (codes réciproques), public (opt-in), défi de la semaine, saison de 6 semaines | `classement.html`, `js/policy.js` (règles communes site + serveur) |
| Chat : filtre (liens, e-mails, téléphones, insultes, contacts externes), signalement, masquage à 3 signalements, sourdine | `chat.html`, `server/features.js`, admin « Modération » |
| Anti-triche et journal | admin « Triche » |
| Appli installable, hors ligne, rappel | `manifest.webmanifest`, `sw.js`, `offline.html`, `js/pwa.js` |
| Site en **7 langues** (fr, en, es, pt, ar de droite à gauche, zh, hi), sélecteur en bas de page, langue mémorisée sur le compte | `js/i18n.js`, `js/i18n-*.js` (générés par `_dev/build_i18n.py` depuis `_dev/i18n/`) ; parcours principal seulement, traductions automatiques à faire relire |
| **Nouvelles couleurs des cartes** : commun gris, rare violet, épique rose fuchsia, légendaire jaune or, mythique rouge, spéciales (Repos, Tractions) blanc pur + écarlate | `js/gachaengine.js` (`RARITIES`, `SPECIALS`), `css/card.css` |
| **Visite guidée de la 1re visite** : « Nev », une petite flamme animée, saute d'élément en élément (clavier, mobile, mouvement réduit respectés) ; à revoir via Tuto → « Revoir la visite guidée » ou `accueil.html?tour=1` | `js/tour.js`, `css/tour.css` |
| **Admin : cadeaux et rôle** — offrir des flammes et/ou des tirages de gacha bonus (notification au joueur), nommer ou retirer un admin (réservé au propriétaire connecté par mot de passe) | admin → Joueurs → « 🎁 Cadeau / rôle » ; `server/server.js` (`admin/gift`, `admin/role`), `server/features.js` (`mergeGifts`) |
| **Tirages bonus** : bouton « Utiliser un tirage bonus » sur la page gacha | `js/p-gacha.js` |
| **Appli téléchargeable** : bandeau « Installer », raccourcis, Dockerfile, lien Play Store | `PUBLIER-EN-APPLI.md`, `js/pwa.js`, `manifest.webmanifest`, `.well-known/assetlinks.json` |
| Héros 3D + histoire en 3D | `js/figure3d.js`, `js/hero3d.js`, `histoire.html`, `vendor/three/` (r128, licence MIT) |
| **Histoire animée en 3D avec voix** (personnages qui bougent, tu peux toucher / glisser / incliner le téléphone ; 9 chapitres, voix off française, mode paysage / portrait / petit écran) + **vidéos MP4** paysage 16:9 et portrait 9:16 | `histoire-anime.html`, `css/histoire-anime.css`, `js/histoire-anime.js` (lecteur), `js/histoire-anime-data.js` (**le fichier à modifier : textes, minutage, voix**), `js/story-rig.js` (personnages), `js/story-scenes.js` (décors et 11 scènes), `media/histoire-voix.mp3`, `media/histoire-neVBOOSTER-paysage.mp4`, `media/histoire-neVBOOSTER-portrait.mp4` |
| **Gacha Box en 3D** (boîte noire et violette sur une table, une main l'ouvre, plonge sans regarder et tire 4 cartes qui se retournent ; une carte Combo possible ; sons et voix de motivation ; bouton « Lancer la séance » : 3 s de transition + 7 s de compte à rebours par exercice) | `gacha-box.html`, `css/gacha-box.css`, `js/gacha-box3d.js` (scène 3D, main, cartes), `js/box-audio.js` (sons + voix), `js/p-gacha-box.js` (page), `media/box-voix.mp3` (voix), `js/gachaengine.js` (tirage `drawBox`/`ensureBox`), `js/core.js` (`completeBox`), `js/p-exercice.js` (`?src=box`), `GACHA-BOX.md` (guide) |
| **Début du site** : logo → notre vision → **l'histoire animée du jeune homme** (`histoire-anime.html`) → connexion. L'ancienne animation « le réveil » (`reveil.js`, `reveil.css`) n'est plus utilisée et peut être supprimée | `index.html`, `intro.js`, `intro.css` |
| Mise en page aérée (cartes séparées, pied de page) | `css/nev.css`, `css/content.css` |

## 8. Limites connues (par honnêteté)

- La vidéo du site a été enregistrée en mode **simulation** de la caméra pour la séance.
- En **mode démo** (sans serveur), les joueurs ne se voient pas entre appareils et le suivi ne montre que ce navigateur.
- La caméra exige `https` ou `localhost` : elle peut être bloquée si le site est affiché dans un cadre (iframe) d'un autre site.
- La base SQLite utilise le module `node:sqlite` de Node, encore marqué « expérimental » : Node affiche un avertissement au démarrage (sans gravité) et il faut Node 22.13+.
- La console SQL est exécutée dans le processus du serveur : une requête volontairement énorme pourrait le ralentir un instant (accès réservé à l'admin).
- Pas d'écran de restauration : la restauration se fait en remplaçant le fichier `nev.db` (voir plus haut).
- La version **anglaise** couvre le parcours principal (connexion, niveau, accueil, quête, gacha, récompenses, classement, chat, compte, histoire). Les pages longues, les textes juridiques, les noms d'exercices et les messages d'erreur du serveur restent en français.
- Le **rappel** de séance s'affiche à l'ouverture de l'appli ; sans service de notification dédié, un site ne peut pas réveiller un téléphone.
- La 3D demande WebGL ; sans WebGL, la version 2D reste affichée.
- **Gacha Box** : scène 3D (three.js) ; sans WebGL, une version 2D simple s'affiche. Le tirage (4 cartes, 1 par jour) est fait AVANT l'animation par le moteur existant ; les animations ne changent jamais le résultat. La voix de motivation est synthétique, en français seulement (Piper, voix « siwis », licence CC BY 4.0). La page n'est pas encore traduite en anglais. Le réglage « chance de combo » (50 %) se change dans `NEV.cfg.box` (voir `GACHA-BOX.md`).
- **Histoire animée** : les personnages sont des figures 3D illustrées (pas des photos) ; la voix off est synthétique et en français seulement (Piper, voix « siwis », licence CC BY 4.0, mention dans la page). Pour changer un texte, modifie `js/histoire-anime-data.js` ; si tu changes la voix, refais `media/histoire-voix.mp3` et mets à jour `T`, `voiceAt` et `voiceDur` dans ce même fichier. Le serveur Node gère les requêtes « Range » (lecture et déplacement dans la voix et les vidéos, nécessaire sur iPhone) ; sur un hébergement statique, cela dépend de l'hébergeur.
- Les cartes **Tractions** ne sortent que si le joueur a indiqué une barre ou une table solide.
- La règle « au moins 4 jours d'entraînement » est interprétée sur une fenêtre glissante de 7 jours.

---

## 9. Suggestions

Écris à **nevlarchitecteopere@gmail.com** avec : ce que tu veux ajouter, ce qui t'a gêné, une capture d'écran si possible.

Bon entraînement. 🔥
