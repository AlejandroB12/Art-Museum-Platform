FROM node:18-alpine
RUN apk add --no-cache vips-dev
WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY shared/ ./shared/
COPY modules/admin/ ./modules/admin/

RUN npx prisma generate --schema=./modules/admin/src/models/prisma/admin.prisma

EXPOSE 3007
CMD ["node", "modules/admin/src/index.js"]
