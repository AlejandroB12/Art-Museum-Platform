FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/recommendations/ ./modules/recommendations/
EXPOSE 3005
CMD ["node", "modules/recommendations/src/index.js"]
