FROM    nginxinc/nginx-unprivileged:1.20
COPY    /usr/src/nuxt-app/dist /usr/share/nginx/html