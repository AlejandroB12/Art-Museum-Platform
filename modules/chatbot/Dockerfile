FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY shared/ ./shared/
COPY modules/chatbot/ ./modules/chatbot/
EXPOSE 3006
CMD ["node", "modules/chatbot/src/index.js"]
