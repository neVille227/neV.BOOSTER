# Rapport d'audit technique — neV.BOOSTER

Date : 17 novembre 2026  
Périmètre : archives ZIP fournies par le propriétaire. Audit statique et exécution de la suite de tests locale ; aucune modification du code source.

## 1. Sources examinées

- `neVBOOSTER-SITE-COMPLET-1-code.zip`
- `neVBOOSTER-SITE-COMPLET-2-media.zip`
- `neVBOOSTER-SITE-COMPLET-3-vendor.zip`
- `V24-SUPPRESSION-COMPTE-A-AJOUTER.zip`

Les médias et dépendances ont été assemblés avec le code dans un répertoire de travail temporaire afin de tester le projet complet.

## 2. Résultats vérifiables

- Suite `node server/test.js` après assemblage : **292 contrôles réussis, 1 échec**.
- Vérification syntaxique `node --check` de tous les fichiers JavaScript du projet hors dépendances vendor : **aucune erreur détectée**.
- Runtime local utilisé : Node.js v22.16.0.
- Les fichiers du ZIP V24 (`server/test.js`, `server/features.js`, `sw.js`, `js/p-compte.js`, `README.md`) sont identiques à ceux de l'archive principale. La V24 est donc déjà intégrée ; aucune fusion n'est requise.

## 3. Anomalie confirmée

### Fichier Android `assetlinks.json` absent

Le seul contrôle restant en échec est `assetlinks.json servi (lien appli Android)`. Le serveur autorise explicitement `/.well-known/assetlinks.json`, mais ce fichier n'est pas présent dans les archives examinées. L'association Android liée au domaine ne peut donc pas être validée avec le contenu actuel.

Le fichier doit être créé uniquement avec les empreintes et identifiants réels de l'application Android publiée. Ne pas inventer ces valeurs.

## 4. Points de vigilance prioritaires

### P1 — Protection des mineurs et chat

Le code d'inscription ne collecte pas l'âge. Les conditions recommandent aux mineurs d'être accompagnés, mais le serveur n'applique pas de règle d'âge. Le README reconnaît que l'âge a été retiré et que les protections correspondantes ne sont plus actives. Le chat public et les interactions sociales nécessitent donc une politique d'âge et de sécurité explicite, relue juridiquement avant ouverture large.

### P1 — Ressources graphiques et audio

`ASSETS.md` indique encore « À VÉRIFIER » pour plusieurs ressources, notamment les visuels Baki/Yuki, les logos/icônes et certaines voix. Le registre mentionne aussi d'anciens médias d'histoire qui ne correspondent pas nécessairement aux trois fichiers présents dans l'archive média. Les droits d'utilisation doivent être documentés ou les ressources remplacées avant diffusion publique.

### P1 — Exploitation Render et sauvegardes

`render.yaml` prévoit un disque persistant monté sur `/var/data` et `NEV_DATA=/var/data`, ce qui est cohérent avec le stockage SQLite. En revanche, les variables SMTP, l'URL publique et le mot de passe administrateur doivent être renseignés et vérifiés dans le tableau de bord Render. Le dépôt de code ne permet pas de confirmer leur configuration réelle.

Le système conserve sept sauvegardes quotidiennes sur le disque du service. La checklist demande aussi une copie hors serveur : cette opération reste manuelle et doit être vérifiée.

### P2 — Documentation à actualiser

Le README contient plusieurs nombres de tests historiques différents (131, 189, 277, 286) alors que la suite actuelle en exécute 293 dans l'environnement assemblé. La documentation et `ASSETS.md` doivent être synchronisées avec les fichiers et tests présents.

### P2 — Suppression de compte V24

La suppression sans mot de passe est présente côté interface et serveur. Elle exige une session ouverte et une confirmation explicite dans l'application ; les tests vérifient la confirmation obligatoire, la suppression et l'impossibilité de se reconnecter. Le courriel de confirmation dépend toutefois de la configuration SMTP.

## 5. Architecture confirmée dans les fichiers

- Frontend : pages HTML, CSS et JavaScript.
- Backend : serveur Node.js sans dépendance applicative externe.
- Données : SQLite via `node:sqlite`, avec séparation entre `database.sqlite` et `auth.db`.
- Hébergement prévu : Render, runtime Docker Node 22, port fourni par l'environnement, disque persistant.
- Dépendances locales : Three.js et MediaPipe dans `vendor/`.
- Médias : vidéo de présentation et deux fichiers audio dans `media/`.

## 6. Plan d'action recommandé

1. Régler le fichier `assetlinks.json` avec les vraies données de l'application Android, si une application Android publiée est prévue.
2. Définir les règles de protection des mineurs et de sécurité des interactions sociales ; faire valider les textes par un professionnel compétent.
3. Compléter le registre des droits des images, personnages, voix, vidéos et musiques.
4. Vérifier dans Render les variables d'environnement, le disque persistant, l'envoi SMTP et le domaine public.
5. Effectuer une sauvegarde hors serveur et tester une restauration contrôlée.
6. Mettre à jour README et checklist à partir de l'état réellement livré.
7. Réaliser des essais sur appareils mobiles réels, notamment caméra, performances, PWA et notifications.

## 7. Limites de cet audit

Cet audit porte sur les archives fournies et leur exécution locale. L'accès automatisé au site public n'a pas abouti lors de cette vérification ; l'état actuellement déployé sur Render, ses variables d'environnement, son contenu de base de données, ses sauvegardes et son comportement réel en production ne sont donc pas certifiés ici.

Aucun fichier source de l'utilisateur n'a été modifié.
