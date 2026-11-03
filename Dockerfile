# neV.BOOSTER — image prête à déployer (Node >= 22.13, aucune dépendance npm)
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
# La base de données n'est JAMAIS dans l'image ni sur GitHub : elle est sur le disque persistant Render (/var/data).
ENV NEV_DATA=/var/data
CMD ["node", "server/server.js"]
