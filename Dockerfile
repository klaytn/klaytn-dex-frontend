# Dockerfile
FROM node:14-alpine

# update and install dependency
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*

# create destination directory, copy the app \
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

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD [ "npm", "start" ]