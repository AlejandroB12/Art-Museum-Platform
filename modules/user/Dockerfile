FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/user/ ./modules/user/
EXPOSE 3003
CMD ["node", "modules/user/src/index.js"]
