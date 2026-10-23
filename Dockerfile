# neV.BOOSTER — image prête à déployer (Node >= 22.13, aucune dépendance npm)
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
VOLUME ["/app/server/data"]
CMD ["node", "server/server.js"]
