FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/admin/ ./modules/admin/
EXPOSE 3007
CMD ["node", "modules/admin/src/index.js"]
