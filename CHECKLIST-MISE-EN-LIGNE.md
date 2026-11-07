# Checklist de mise en ligne — neV.BOOSTER

Reprend le plan d'action prioritaire de l'audit. Ce qui est fait dans le code est coché ; le reste dépend de toi (comptes, appareils, juridique).

## 1. Comptes et données (priorité 1)
- [x] Base SQLite sur disque persistant Render (`render.yaml`, `NEV_DATA=/var/data`).
- [x] Sauvegarde automatique quotidienne (7 conservées) + téléchargement depuis l'admin.
- [ ] Sur Render : renseigner `NEV_SMTP_HOST`, `NEV_SMTP_PORT`, `NEV_SMTP_USER`, `NEV_SMTP_PASS`, `NEV_SMTP_FROM`, `NEV_BASE_URL`, `NEV_ADMIN_PASSWORD`.
- [ ] Vérifier le disque : redéployer une fois, puis confirmer que les comptes existent toujours.
- [ ] Télécharger une sauvegarde depuis l'admin et la garder hors du serveur (1 fois par semaine).
- [ ] Tester : inscription, code reçu par e-mail (boîte principale ET spam), connexion, mot de passe oublié.

## 2. Phase de test (priorité 2)
- [ ] 5 à 10 testeurs, au moins 2 iPhone et 3 Android (dont 1 modeste).
- [ ] Tester : comptage caméra, notifications fermées, 3D, mode allégé (Mon compte), connexion lente (mode économie de données).
- [ ] Noter chaque problème avec : appareil, navigateur, page, capture d'écran.

## 3. Droits des ressources (priorité 3)
- [ ] Remplir `ASSETS.md` pour chaque image, vidéo et voix. Remplacer ce qui ne peut pas être justifié.

## 4. Interface (priorité 4) — fait
- [x] Profils et messages, Chat et Amis réunis sous une seule entrée « Communauté » (3 onglets).

## 5. Mobile (priorité 5) — fait
- [x] Mode allégé : automatique (appareil ≤ 2 Go / ≤ 2 cœurs, 2G/3G, économie de données) ou manuel (Mon compte). Coupe la 3D et les animations lourdes.

## 6. Mesure et déploiement progressif (priorités 6 et 7)
- [ ] Regarder dans l'admin la fréquence de retour (jours actifs par joueur) après 2 semaines.
- [ ] Ouvrir les nouveautés par étapes : 10 testeurs, puis 50, puis tout le monde.

## Messagerie et mineurs
- [x] Blocage, signalement, confidentialité du profil, limites d'envoi, modération admin.
- [ ] Décider de l'âge minimum et l'écrire dans les Conditions. Si des mineurs sont admis : conserver la messagerie privée désactivée par défaut pour eux (non codé : à valider avec toi).
