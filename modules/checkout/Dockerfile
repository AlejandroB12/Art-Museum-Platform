FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY modules/checkout/ ./modules/checkout/

EXPOSE 3004
CMD ["node", "modules/checkout/src/index.js"]
