FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app/server

# Copy package trước để tận dụng cache
COPY server/package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source
COPY server/ .

# Sinh Prisma Client
RUN npx prisma generate

# Port server và Prisma Studio
EXPOSE 3011
EXPOSE 5555

# Chạy server
CMD ["node", "server.js"]