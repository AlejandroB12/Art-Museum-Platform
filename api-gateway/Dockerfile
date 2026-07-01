FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY api-gateway/ ./api-gateway/
COPY modules/ ./modules/
COPY views/ ./views/
COPY assets/ ./assets/
EXPOSE 3000
CMD ["node", "api-gateway/src/index.js"]
