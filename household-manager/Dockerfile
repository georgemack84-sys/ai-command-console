FROM node:22-bookworm-slim AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_HOUSEHOLD_BASE_PATH
ARG NEXT_PUBLIC_PROPRIUM_API_ORIGIN
ARG NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID
ENV NEXT_PUBLIC_HOUSEHOLD_BASE_PATH=$NEXT_PUBLIC_HOUSEHOLD_BASE_PATH
ENV NEXT_PUBLIC_PROPRIUM_API_ORIGIN=$NEXT_PUBLIC_PROPRIUM_API_ORIGIN
ENV NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID=$NEXT_PUBLIC_PROPRIUM_HOUSEHOLD_ID
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
