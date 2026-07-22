FROM node:22.13.1-slim
WORKDIR /app
COPY package.json ./
COPY server.mjs ./server.mjs
COPY src ./src
EXPOSE 5174
CMD ["node", "server.mjs"]
