FROM node:22.13-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/domain/package.json ./packages/domain/package.json
COPY services/event-service/package.json ./services/event-service/package.json
RUN npm ci
COPY packages/domain ./packages/domain
RUN npm run build --workspace @t2w/domain
COPY services/event-service/tsconfig.json ./services/event-service/tsconfig.json
COPY services/event-service/prisma ./services/event-service/prisma
COPY services/event-service/src ./services/event-service/src
RUN npm run prisma:generate --workspace t2w-event-service && npm run build --workspace t2w-event-service

FROM node:22.13-alpine
WORKDIR /app/services/event-service
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/domain/package.json /app/packages/domain/package.json
COPY --from=build /app/packages/domain/dist /app/packages/domain/dist
COPY --from=build /app/services/event-service/package.json ./package.json
COPY --from=build /app/services/event-service/dist ./dist
COPY --from=build /app/services/event-service/prisma ./prisma
CMD ["node", "dist/main.js"]
