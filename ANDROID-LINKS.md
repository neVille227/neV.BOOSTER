# Association du domaine à l'application Android

Le serveur peut générer `/.well-known/assetlinks.json` à la demande. Il ne faut jamais inventer le nom du package ni l'empreinte du certificat.

Configurer sur Render :

- `NEV_ANDROID_PACKAGE_NAME` : identifiant Android exact, par exemple `com.exemple.application` (exemple fictif uniquement).
- `NEV_ANDROID_SHA256_CERT_FINGERPRINTS` : empreinte SHA-256 du certificat de signature, au format `AA:BB:...` (32 octets, 32 paires hexadécimales), éventuellement plusieurs empreintes séparées par des virgules.

Utiliser les valeurs de la version réellement publiée. Si l'application est distribuée par Google Play avec Play App Signing, utiliser l'empreinte du certificat de signature d'application affichée dans Play Console, et non supposer qu'il s'agit du certificat d'upload.

Tant que les valeurs ne sont pas renseignées ou sont invalides, l'URL répond 404. C'est intentionnel : le site ne publie pas de déclaration Digital Asset Links incorrecte.
