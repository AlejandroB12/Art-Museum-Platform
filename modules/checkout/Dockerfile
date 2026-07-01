FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/checkout/ ./modules/checkout/
EXPOSE 3004
CMD ["node", "modules/checkout/src/index.js"]
