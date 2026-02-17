# Build stage
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD [ "npm", "start" ]
