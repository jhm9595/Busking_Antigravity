FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Environment variables
ENV REALTIME_CONTROL_TOKEN_SECRET=${REALTIME_CONTROL_TOKEN_SECRET}
ENV REDIS_URL=${REDIS_URL}

EXPOSE 4000

CMD ["npm", "start"]
