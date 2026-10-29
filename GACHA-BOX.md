# Gacha Box — guide simple

Page : `gacha-box.html` (menu → « Gacha Box », tuile sur l'accueil, bouton sur la page Gacha).

## Ce que voit le joueur

1. **Apparition** : une boîte noire et violette (arêtes lumineuses) se matérialise sur une table.
2. **Ouverture** : il touche « Ouvrir la boîte ». Une main soulève le couvercle.
3. **Tirage** : la main plonge **sans regarder**, fouille, sort une carte, la pose face cachée… quatre fois.
4. **Révélation** : les cartes se retournent une à une (étincelles ; plus fort pour une carte Combo).
5. **« Lancer la séance »** : les exercices s'enchaînent. Pour chaque exercice : **3 s de transition**, puis **7 s de compte à rebours**, puis le comptage (caméra ou à la main, comme d'habitude).

Boutons : « Passer l'animation » (en plein tirage), option « Passer les animations » (toujours), « Revoir l'animation », « Nouveau tirage » (seulement avec un tirage bonus 🎁). On peut glisser pour tourner la vue et toucher une carte pour l'agrandir. Le bouton « Son » coupe sons et voix.

## Les règles

- **Une boîte par jour** : 4 cartes, tirées une seule fois (elles ne changent pas si on quitte la page).
- **Carte Exercice** : un exercice de la bibliothèque, tiré par le même moteur que le gacha du jour (niveau, matériel, raretés, « pitié »). Une carte spéciale (Repos, Tractions) ne sort pas dans la boîte.
- **Carte Combo** : un enchaînement de 2 à 4 exercices dans **un seul emplacement** (50 % de chance qu'une boîte en contienne un, si des combos correspondent au matériel).
- **XP** : 18 + 10 × difficulté par carte Exercice, 14 + 8 × nombre d'exercices pour un Combo ; ÷2 sans caméra ; ×1,5 un jour de rattrapage ; ×0,6 si la carte du jour est déjà validée.
- Valider la boîte valide aussi la **séance du jour** (série, flammes, badges).

## Fichiers

| Fichier | Rôle |
|---|---|
| `gacha-box.html`, `css/gacha-box.css` | La page et son style (noir / violet / blanc) |
| `js/p-gacha-box.js` | La logique de la page : tirage **avant** l'animation, étapes, boutons, version 2D |
| `js/gacha-box3d.js` | La scène 3D : table, boîte, couvercle, main, cartes, particules, caméra |
| `js/box-audio.js` | Les bruitages (synthétisés) + la voix de motivation |
| `media/box-voix.mp3` | La voix (15 phrases à la suite) ; positions dans `VOICE` de `js/box-audio.js` |
| `_dev/voice_box.py` (projet complet, pas sur GitHub) | Refait `box-voix.mp3` et affiche la table `VOICE` (Piper, voix « siwis », CC BY 4.0) |
| `js/gachaengine.js` | `drawBox`, `ensureBox`, `comboPool`, `boxCfg` (le tirage) |
| `js/core.js` | `p.box` (l'état du jour) et `completeBox` (XP, historique) |
| `js/p-exercice.js`, `exercice.html` | `exercice.html?src=box` : la séance (transition 3 s + compte à rebours 7 s) |

## Réglages

Dans le tirage (`js/gachaengine.js`, `BOX`) : `cards: 4`, `sets: 1` (séries par exercice), `comboChance: 0.5`.
L'admin peut les surcharger avec `NEV.cfg.box = { comboChance: 0.3 }`.

## Tester

- `gacha-box.html?skip=1` : sans animation. `?flat=1` : force la version 2D.
- `exercice.html?src=box&sim=1&speed=4` : l'avatar fait les exercices à la place de la caméra.

## Limites

- Main et décor sont des formes 3D simples (pas de photos ni de scan).
- Voix synthétique, en français. Page non traduite en anglais pour l'instant.
- Sans WebGL : version 2D (cartes qui se retournent), mêmes règles, mêmes sons.
