FROM node:20.19.5

WORKDIR /app

COPY package*.json .

RUN npm ci

EXPOSE 5005

COPY . .

RUN npm run build

CMD [ "npm","run","dev" ]