# base image
FROM oven/bun:alpine as base
WORKDIR /app

#install dependencies
FROM base as deps
COPY package.json ./
COPY bun.lock ./
RUN bun install --frozen-lockfile

# development stage
FROM base as development
COPY . .
# note: installation of dependncies will happen IN container
EXPOSE 4000
CMD ["bun", "--watch", "src/index.ts"]

# build stage
FROM deps as build
COPY . .
RUN bun build ./src/index.ts --outdir ./dist --target=bun

# runtime 
FROM base as release
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 4000

CMD ["bun", "dist/index.js"]
