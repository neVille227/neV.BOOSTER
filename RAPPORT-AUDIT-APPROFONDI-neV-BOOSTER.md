# Rapport d'audit approfondi — neV.BOOSTER

Date : 17 novembre 2026  
Périmètre : archive `neVBOOSTER-SITE-COMPLET-CORRIGE.zip` extraite et examinée localement.  
Limite : cet audit porte sur le code et les documents fournis. Il ne constitue ni un test d'intrusion, ni une validation juridique, ni une vérification de la configuration réelle du tableau de bord Render ou de la version actuellement déployée.

## 1. Vérifications exécutées

- Suite automatisée `node --test server/test.js` : **293 réussis, 0 échoué**.
- Node utilisé pour l'exécution : v22.16.0.
- Références locales `src` / `href` dans les pages HTML : aucune référence locale manquante détectée.
- Pages HTML : 43 au total ; les 7 pages du sous-dossier `femme/` sans balise viewport sont des pages de redirection immédiate vers les pages principales. Les pages principales comportent leur viewport.
- Configuration Render examinée : service Docker, disque persistant `/var/data`, `NEV_SECURE=1`, `NEV_TRUST_PROXY=1`, `NEV_DATA=/var/data`.

Ces résultats valident la suite de tests et plusieurs propriétés du code. Ils ne prouvent pas que la configuration Render réelle correspond au fichier `render.yaml`.

## 2. Points positifs observés

- Mots de passe des comptes traités avec `crypto.scrypt` et un sel ; les données d'authentification sont séparées de la base applicative.
- Cookies de session `HttpOnly`, `SameSite=Strict`, et `Secure` lorsque le serveur est configuré derrière HTTPS.
- Contrôle d'origine et en-tête personnalisé pour les requêtes de modification.
- En-têtes CSP, anti-framing, `nosniff`, politique de référent et permissions caméra restreintes.
- Accès aux fonctions d'administration vérifié côté serveur, avec rôles distincts.
- Tests couvrant notamment l'accès non autorisé à l'administration, l'injection SQL dans les filtres, les exports, les sauvegardes, les suppressions et la persistance après redémarrage.
- Les tests confirment la suppression en cascade des données d'un compte et la suppression sans mot de passe de la version V24, avec session ouverte et confirmation explicite.
- Le mode caméra est conçu pour analyser le mouvement sur l'appareil ; les documents indiquent que les images et vidéos ne sont pas envoyées au serveur.
- La configuration Render déclarée prévoit un disque persistant pour SQLite.

## 3. Risques et corrections recommandées

### Priorité critique — Protection des mineurs et paramètres sociaux par défaut

Constat dans le code : aucun âge n'est demandé à l'inscription et aucune tranche d'âge n'est enregistrée. Le formulaire demande seulement de cocher une case indiquant que, si la personne est mineure, elle a l'accord d'un parent ou tuteur. Cette déclaration n'est pas vérifiée.

Constat dans la base : un nouveau profil est créé avec `vis='public'` et `dm='all'`. Les profils publics peuvent être recherchés et les messages privés sont autorisés par défaut depuis tout compte connecté, sous réserve des blocages et réglages du destinataire.

Risque : l'application ne distingue pas les comptes mineurs des comptes adultes et n'applique donc pas de réglages sociaux spécifiques aux mineurs. Les profils et messages privés ouverts par défaut augmentent l'exposition aux contacts non sollicités.

Recommandation avant ouverture publique : définir la politique d'âge du service avec un conseil juridique local. Si les mineurs sont admis, prévoir un parcours adapté et des réglages protecteurs par défaut : profil privé ou limité aux contacts, messagerie privée désactivée ou limitée aux amis approuvés, classement public désactivé par défaut, mécanisme de signalement et de blocage facile à trouver, et procédure de gestion parentale adaptée au cadre légal. Ne pas considérer la simple case actuelle comme une vérification parentale.

### Priorité élevée — Modération des messages privés

Constat : le salon public applique une fonction de modération de texte. Dans la route d'envoi des messages privés, le texte est nettoyé et limité en longueur, mais il ne passe pas par le même filtre de modération du contenu. Le système dispose toutefois de blocage et de signalement des conversations/messages.

Risque : les protections présentes dans le salon public ne couvrent pas de manière équivalente la messagerie privée.

Recommandation : appliquer une politique de sécurité cohérente aux messages privés, avec limites anti-spam, signalement contextualisé, blocage immédiat, outils de modération proportionnés et règles explicites de traitement des signalements. Éviter de promettre une modération ou une confidentialité absolue que le fonctionnement réel ne garantit pas.

### Priorité élevée — Propriété intellectuelle des médias et personnages

Constat : `ASSETS.md` laisse encore plusieurs éléments importants au statut « À VÉRIFIER », notamment les images liées à Baki et Yuki, certains avatars, logos, bannières, vidéos et voix.

Risque : le droit d'utiliser ces ressources publiquement ou commercialement n'est pas démontré par les archives.

Recommandation : documenter l'auteur, la licence et la preuve d'autorisation de chaque ressource ; remplacer toute ressource non autorisée avant lancement public ou commercial. La présence d'un fichier dans l'archive ne prouve pas que son usage est autorisé.

### Priorité élevée — Exactitude de la politique de confidentialité

Constat : `confidentialite.html` indique que le mot de passe est « chiffré ». Le code utilise `scrypt`, qui produit un hachage dérivé avec sel ; il ne s'agit pas d'un chiffrement réversible.

Recommandation : remplacer cette formulation par « mot de passe haché avec scrypt et un sel individuel ». Vérifier aussi que les affirmations sur les prestataires, les transferts internationaux, les délais de conservation et les fonctionnalités réellement activées correspondent à l'exploitation effective.

### Priorité moyenne — Suppression du compte sans réauthentification

Constat : la route `account/delete` exige une session active et une confirmation explicite, mais ne demande pas de mot de passe ni de code e-mail récent. Cela correspond à la spécification V24.

Risque : si une session est compromise ou laissée ouverte sur un appareil partagé, un tiers ayant accès à cette session pourrait déclencher la suppression du compte.

Recommandation : conserver une suppression simple, mais ajouter une confirmation renforcée facultative ou obligatoire selon le niveau de risque (par exemple code envoyé à l'adresse vérifiée), sans nécessairement réintroduire la saisie du mot de passe.

### Priorité moyenne — Classement public activé par défaut

Constat : l'écran d'inscription annonce que le pseudo apparaîtra dans le classement public et que l'utilisateur pourra s'en retirer ensuite. Le code conserve ce choix public par défaut.

Recommandation : privilégier un choix explicite à l'inscription, avec visibilité publique désactivée par défaut, particulièrement si des mineurs peuvent utiliser le service.

### Priorité moyenne — Limitation de débit en mémoire

Constat : les compteurs de limitation de débit sont conservés dans une `Map` en mémoire du processus Node.

Risque : ils sont remis à zéro au redémarrage et ne sont pas partagés entre plusieurs instances. Cela reste fonctionnel pour une instance simple, mais devient moins robuste en cas de redémarrage fréquent ou de montée en charge multi-instance.

Recommandation : si le service évolue vers plusieurs instances, déplacer les limites sensibles vers un stockage partagé et persistant. Pour le lancement initial, vérifier les limites et alertes dans l'environnement Render réel.

## 4. Points opérationnels non vérifiables depuis les archives

À contrôler directement dans Render et sur des appareils physiques :

- Valeurs réelles de `NEV_ADMIN_PASSWORD`, `NEV_BASE_URL`, `NEV_SMTP_*`, `NEV_SECURE`, `NEV_TRUST_PROXY` et `NEV_DATA`.
- Présence effective du disque persistant et conservation des comptes après un redéploiement.
- Sauvegarde téléchargée et copie hors du serveur, puis test de restauration.
- Envoi réel des e-mails de vérification et de récupération de compte.
- Caméra et comptage des répétitions sur plusieurs téléphones, navigateurs, éclairages et niveaux de performance.
- Fonctionnement réel des notifications push ; le code doit être testé avec les permissions et services push des appareils cibles.
- Test de parcours complet sur petits écrans, iOS et Android. La suite automatisée ne remplace pas ces tests manuels.
- Vérification que la version en production correspond exactement à l'archive auditée.

## 5. Décision de mise en ligne

**Avis : ne pas ouvrir largement au public avant traitement des priorités critiques et élevées.**

Ordre recommandé :
1. Décider de la politique d'âge et des protections sociales par défaut.
2. Renforcer la modération des messages privés.
3. Régler les droits des ressources visuelles et sonores.
4. Corriger la formulation de la politique de confidentialité et faire relire les textes juridiques par un professionnel compétent au Bénin.
5. Décider du niveau de confirmation supplémentaire pour la suppression du compte.
6. Vérifier Render, les sauvegardes, les e-mails et les appareils réels.
7. Procéder à un lancement pilote limité, puis élargir progressivement après retour des testeurs.

## 6. Conclusion

La base technique présente plusieurs protections sérieuses et les 293 tests automatisés passent. Les principaux freins identifiés avant une ouverture publique ne sont pas des erreurs de syntaxe : ils concernent surtout la protection des mineurs, les messages privés, les droits des médias, la transparence des informations de confidentialité et la validation de l'environnement de production.
