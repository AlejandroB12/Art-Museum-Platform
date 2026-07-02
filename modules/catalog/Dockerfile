FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/catalog/ ./modules/catalog/
EXPOSE 3002
CMD ["node", "modules/catalog/src/index.js"]
