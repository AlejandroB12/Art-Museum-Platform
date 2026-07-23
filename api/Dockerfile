FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY api/ ./api/
COPY controllers/ ./controllers/
COPY views/ ./views/
COPY assets/ ./assets/
COPY modules/ ./modules/

EXPOSE 3000
CMD ["node", "api/src/index.js"]
