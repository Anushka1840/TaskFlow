FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

# Run migrations then start the server
CMD npx prisma migrate deploy && npm run dev
