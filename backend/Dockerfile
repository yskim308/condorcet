# base image
FROM oven/bun:alpine as base
WORKDIR /app

#install dependencies
FROM base as deps
COPY package*.json ./
COPY bun*.lockb ./
RUN bun install

# development stage
FROM deps as development
COPY . .
EXPOSE 4000
CMD ["bun", "--watch", "index.ts"]

# build stage
FROM deps as build
COPY . .
RUN bun build ./index.ts --outdir ./dist --target=bun

# runtime 
FROM base as release
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 4000

CMD ["bun", "run", "dist/index.js"]
