# Publier neV.BOOSTER comme application téléchargeable

neV.BOOSTER est une **PWA** (appli web installable) : tu publies **un seul site**, et les joueurs l'installent depuis leur navigateur, sans passer par un magasin. Tout est déjà prêt dans le dossier : `manifest.webmanifest`, `sw.js` (hors ligne), icônes 192/512/maskable, bandeau « Installer l'appli ».

## 1. Ce qu'il te faut (une seule fois)

| Besoin | Pourquoi |
|---|---|
| Un **nom de domaine** (ex. `nevbooster.com`) | adresse publique de l'appli |
| **HTTPS** (certificat) | *obligatoire* : sans HTTPS, les navigateurs refusent d'installer l'appli |
| Un hébergeur qui lance **Node.js ≥ 22.13** (VPS, Render, Railway, Fly.io…) | c'est le serveur `node server/server.js` |
| Un disque **persistant** pour `server/data/` | c'est la base SQLite et les sauvegardes |

## 2. Lancer le serveur

```bash
NEV_ADMIN_PASSWORD="choisis-un-long-mot-de-passe" \
NEV_BASE_URL="https://nevbooster.com" \
node server/server.js
```

- Le serveur écoute sur le port **8080** (change avec `PORT=…`). Place-le **derrière HTTPS** : Caddy, Nginx, ou le HTTPS automatique de l'hébergeur.
- Exemple Caddy (HTTPS automatique) : `nevbooster.com { reverse_proxy localhost:8080 }`
- Avec Docker : `docker build -t nev . && docker run -d -p 8080:8080 -v nevdata:/app/server/data -e NEV_ADMIN_PASSWORD=… -e NEV_BASE_URL=https://nevbooster.com nev`
- **Envoi d'e-mails** (vérification, mot de passe oublié) : renseigne les variables `NEV_SMTP_*` (voir README §2). Sans cela, les messages restent dans l'admin → « Courriels ».
- Note le mot de passe admin : s'il n'est pas fixé, il est **affiché une seule fois** au premier lancement.

## 3. Comment les joueurs téléchargent l'appli

- **Android (Chrome), ordinateur (Chrome/Edge)** : un bandeau « Installe l'appli neV.BOOSTER » apparaît sur l'accueil, la connexion et le tuto → bouton **Installer**. Aussi dans *Mon compte → Appli et rappel*.
- **iPhone / iPad (Safari)** : le bandeau explique *Partager → Sur l'écran d'accueil* (Apple n'autorise pas de bouton direct).
- Une fois installée : plein écran, icône sur l'écran d'accueil, pages déjà vues disponibles hors ligne, raccourcis « Quête du jour » et « Tirage gacha » (appui long sur l'icône Android).

Mets sur ton site / tes réseaux simplement : **« Ouvre https://nevbooster.com puis touche Installer »**.

## 4. (Facultatif) Google Play Store

Une PWA peut être publiée sur le Play Store sans réécrire le code (*Trusted Web Activity*) :

1. Va sur **pwabuilder.com**, entre l'adresse de ton site, puis *Package for stores → Android*.
2. Télécharge le paquet (`.aab`) et la **clé de signature** (garde-la précieusement).
3. Copie l'empreinte **SHA-256** fournie dans `.well-known/assetlinks.json` (le fichier est livré vide `[]` ; le serveur le publie déjà). Format :
   ```json
   [{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.nevbooster.app","sha256_cert_fingerprints":["AA:BB:…"]}}]
   ```
4. Crée un compte **Google Play Console** (frais uniques ≈ 25 $), envoie le `.aab`, ajoute captures d'écran, description, **politique de confidentialité** (`https://ton-domaine/confidentialite.html`) et le questionnaire « sécurité des données ».
5. L'App Store d'Apple demande un compte payant et un vrai paquet iOS : pour iPhone, l'installation depuis Safari est la voie simple.

## 5. Liste de contrôle avant d'ouvrir au public

- [ ] Domaine + HTTPS fonctionnels (cadenas dans le navigateur)
- [ ] `NEV_ADMIN_PASSWORD` choisi, `NEV_BASE_URL` renseigné
- [ ] SMTP configuré et testé (inscription → e-mail reçu)
- [ ] Textes légaux relus par un juriste et champs « À compléter » remplis (`conditions.html`, `confidentialite.html`, `mentions-legales.html`)
- [ ] Formalités de protection des données de ton pays (au Bénin : APDP)
- [ ] Exercices relus par un coach ou kinésithérapeute (admin → Relecture)
- [ ] Sauvegarde de `server/data/` planifiée (le serveur crée aussi des sauvegardes automatiques)
- [ ] Test d'installation sur un vrai Android **et** un vrai iPhone
- [ ] Lancer `node server/test.js` : tout doit être vert
