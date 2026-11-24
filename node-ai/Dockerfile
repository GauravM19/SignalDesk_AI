FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
EXPOSE 4000
# Run Node directly so Docker's stop signal reaches the HTTP server.
CMD ["node","dist/server.js"]
