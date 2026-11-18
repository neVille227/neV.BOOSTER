# Rapport de corrections techniques — neV.BOOSTER

Date : 17 novembre 2026  
Base : archives fournies par le propriétaire, assemblées dans un répertoire de travail.  
Périmètre : correction du défaut Digital Asset Links Android et revalidation locale.  

## 1. Correction réalisée

Le serveur autorisait `/.well-known/assetlinks.json`, mais aucun fichier valide n'était présent dans les archives. Il aurait été incorrect d'inventer le nom de package Android ou l'empreinte SHA-256 du certificat.

La route génère désormais le JSON Digital Asset Links à partir de deux variables d'environnement :

- `NEV_ANDROID_PACKAGE_NAME` : identifiant Android exact de l'application.
- `NEV_ANDROID_SHA256_CERT_FINGERPRINTS` : une ou plusieurs empreintes SHA-256 de certificats, séparées par des virgules.

Les valeurs sont validées avant publication. Si elles sont absentes ou invalides, la route répond HTTP 404 sans publier de fausses données.

La documentation a été ajoutée dans `ANDROID-LINKS.md` et le README.

## 2. Tests après correction

- Suite automatisée : **293 réussis, 0 échec**.
- Test avec valeurs Android de test : réponse 200 et structure JSON vérifiée.
- Test sans configuration Android : réponse HTTP 404, comportement attendu.
- `node --check` sur les fichiers JavaScript du projet hors dépendances vendor : aucune erreur.
- Les fichiers de logique V24 `server/features.js`, `sw.js` et `js/p-compte.js` restent identiques à ceux de l'archive V24 fournie.

Les identifiants et empreintes utilisés dans les tests sont des valeurs factices de test et ne doivent jamais être configurés en production.

## 3. Fichiers modifiés

- `server/server.js` : génération contrôlée du fichier Android.
- `server/test.js` : test de la génération avec configuration de test.
- `README.md` : documentation des variables Android.
- `ANDROID-LINKS.md` : procédure de configuration Android.

## 4. Actions nécessaires sur Render

Si une application Android associée au domaine existe et doit être activée :

1. Relever l'identifiant exact du package Android.
2. Relever l'empreinte SHA-256 du certificat de signature réellement utilisé. Pour une application distribuée via Play App Signing, vérifier le certificat de signature d'application dans Play Console.
3. Ajouter les deux variables d'environnement mentionnées ci-dessus dans Render.
4. Redéployer puis vérifier `https://nevbooster.onrender.com/.well-known/assetlinks.json`.

Si aucune application Android n'est publiée, laisser ces variables absentes : le 404 est normal.

## 5. Points non modifiés — validation humaine requise

- Les protections liées à l'âge et la politique d'accès des mineurs : le README indique que l'âge a été retiré. Le chat, les interactions sociales et les défis publics doivent faire l'objet d'une politique de sécurité adaptée et d'une validation juridique avant ouverture large.
- Les droits sur les visuels, personnages, voix, vidéos et musiques : `ASSETS.md` comporte encore plusieurs ressources « À VÉRIFIER ». Elles ne doivent pas être considérées comme autorisées sans justificatif.
- Les variables réelles Render, SMTP, le disque persistant, les sauvegardes hors serveur et la restauration : non vérifiables depuis les archives locales.
- Le déploiement en production : aucun déploiement ni changement sur Render n'a été effectué.

## 6. Limites

Cette livraison est une copie corrigée du code fourni, pas une mise à jour du site en production. Les valeurs Android réelles n'ont pas été fournies ; la liaison Android n'est donc pas activée dans cette livraison. Les archives originales n'ont pas été modifiées.
