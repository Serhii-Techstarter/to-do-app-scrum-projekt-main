FROM node:18-bullseye

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3050

CMD ["node", "server.js"]