# neV.BOOSTER — vers l'application mobile

Le site est déjà une **application web installable (PWA)** : icône sur l'écran d'accueil, plein écran, hors ligne partiel, notifications, raccourcis (Quête, Gacha, Mon évolution). Les trois chemins ci-dessous partent de ce socle.

| Chemin | Pour | Ce qu'il faut | Remarque |
|---|---|---|---|
| **PWA installée** (déjà prêt) | Android et iPhone | Rien : « Ajouter à l'écran d'accueil » | Gratuit. Sur iPhone, installation depuis Safari seulement. |
| **Android sur Google Play** (Trusted Web Activity) | Android | Compte Google Play (paiement unique, environ 25 $), outil Bubblewrap ou PWABuilder, `NEV_ANDROID_PACKAGE_NAME` et `NEV_ANDROID_SHA256_CERT_FINGERPRINTS` sur Render (voir `ANDROID-LINKS.md`) | Le site s'affiche dans l'appli sans barre d'adresse. |
| **iPhone sur l'App Store** (Capacitor) | iPhone | Compte Apple Developer (abonnement annuel, environ 99 $), un Mac avec Xcode, projet Capacitor qui charge le site | Apple refuse les « simples sites dans une coquille » : prévoir des fonctions natives (notifications, caméra) et une vraie valeur. |

## Avant de publier dans un magasin
- Politique de confidentialité et conditions : pages `confidentialite.html` et `conditions.html` (à faire relire, surtout la partie mineurs).
- Mineurs : classification d'âge à déclarer ; l'accord parental et les protections existent côté site.
- Photos d'évolution : restent sur l'appareil (aucun envoi), à indiquer dans la fiche « données » des magasins.
- Droits des images (Baki, Yuki, logos, voix, musiques) : voir `ASSETS.md`. Les magasins demandent les preuves.
- Caméra : l'appli doit expliquer pourquoi elle l'utilise (suivi des mouvements, traitement sur l'appareil).
- Tests sur de vrais appareils : caméra, installation, notifications, safe areas (encoche, barre du bas).

## Principes de design suivis (inspirés des Human Interface Guidelines d'Apple)
Clarté (une chose à faire par écran), déférence (le contenu avant le décor), profondeur (relief seulement pour la navigation et les fenêtres), zones tactiles de 44 px, marges de 16 px, barre d'onglets en bas (Accueil, Gacha, Évolution, Social, Profil), texte jamais sous 12 px, réglage « réduire les animations » respecté. Feuille de style : `css/calm.css`.
