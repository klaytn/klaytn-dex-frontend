# Dockerfile
FROM node:14-alpine as builder

# update and install dependency
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*

# create destination directory, copy the app
RUN mkdir -p /usr/src/nuxt-app
COPY . /usr/src/nuxt-app/
RUN chown -R node /usr/src/nuxt-app
WORKDIR /usr/src/nuxt-app

# switch to node user
USER node

# run install and build
RUN npm install && \
    npm run build && \
    npm cache clean -f

# nginx
FROM nginx:1.20-alpine

ARG NGINX_CONF=nginx/klaytn-prod.conf
ENV NGINX_CONF=$NGINX_CONF

RUN rm -rf /etc/nginx/conf.d/*

## Copy our default nginx config
COPY ${NGINX_CONF} /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /usr/src/nuxt-app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
