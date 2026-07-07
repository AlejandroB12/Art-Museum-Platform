FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY api/ ./api/
COPY modules/ ./modules/
COPY views/ ./views/
COPY assets/ ./assets/
EXPOSE 3000
CMD ["node", "api/src/index.js"]
