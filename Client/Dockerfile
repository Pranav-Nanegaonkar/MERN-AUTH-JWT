FROM node:20.19.5

WORKDIR /app

COPY package*.json .

RUN npm ci 

EXPOSE 5173

COPY . .

CMD [ "npm", "run", "dev" ]
