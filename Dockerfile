# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/worker ./worker
COPY --from=build /app/node_modules/node-cron ./node_modules/node-cron
COPY --from=build /app/node_modules/nodemailer ./node_modules/nodemailer
COPY --from=build /app/node_modules/uuid ./node_modules/uuid                
COPY --from=build /app/node_modules/bcryptjs ./node_modules/bcryptjs 
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1
CMD ["sh", "-c", "node worker/seed.js && node worker/index.js & node server.js"]
