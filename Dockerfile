FROM node:lts as build

ARG VITE_ROUTER_HASH_MODE
ENV VITE_ROUTER_HASH_MODE=$VITE_ROUTER_HASH_MODE

WORKDIR /app

COPY package.json package.json

RUN npm install -g pnpm && npm install

COPY . .

RUN VITE_ROUTER_HASH_MODE=$VITE_ROUTER_HASH_MODE pnpm build

FROM nginxinc/nginx-unprivileged:1.20
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
