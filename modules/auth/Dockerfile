FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/auth/ ./modules/auth/
EXPOSE 3001
CMD ["node", "modules/auth/src/index.js"]
