FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY shared/ ./shared/
COPY modules/auth/ ./modules/auth/

EXPOSE 3001
CMD ["node", "modules/auth/src/index.js"]
