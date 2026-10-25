# neV.BOOSTER — image prête à déployer (Node >= 22.13, aucune dépendance npm)
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
# DIAGNOSTIC : affiche le contenu du dossier avant de lancer le serveur (à retirer quand tout marche)
CMD ["sh", "-c", "echo '--- /app ---'; ls -la /app; echo '--- /app/server ---'; ls -la /app/server; node server/server.js"]
