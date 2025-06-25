# base image
FROM oven/bun:slim as base
WORKDIR /app

#install dependencies
FROM base as deps
COPY package*.json ./
COPY bun*.lockb ./
RUN bun install

# build stage
FROM deps as build

COPY . .

RUN bun build ./index.ts --outdir ./dist --target=bun

# runtime 
FROM base as release
WORKDIR /app

#RUN apk update --no-cache && \
    #apk add --no-cache openssl ca-certificates # <--- Use apk add

COPY --from=build /app/dist ./dist
EXPOSE 4000

CMD ["bun", "run", "dist/index.js"]
