FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY modules/user/ ./modules/user/

EXPOSE 3003
CMD ["node", "modules/user/src/index.js"]
