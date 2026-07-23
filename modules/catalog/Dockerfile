FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY modules/catalog/ ./modules/catalog/

EXPOSE 3002
CMD ["node", "modules/catalog/src/index.js"]
