# syntax=docker/dockerfile:1
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS server
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Install serve before switching user
RUN npm install -g serve

RUN addgroup -g 1001 -S admin && adduser -S stl -u 1001
RUN chown -R stl:admin /app

COPY --from=build --chown=stl:admin /app/build ./build

USER stl

EXPOSE 3000
<<<<<<< HEAD
CMD ["serve", "-s", "build", "-l", "3000"]
<<<<<<< HEAD


=======
>>>>>>> d394e4d (Initial commit)
=======
CMD ["serve", "-s", "build", "-l", "3000"]
>>>>>>> fa648d2 (new update)
