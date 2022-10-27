FROM    nginxinc/nginx-unprivileged:1.20
COPY    ./nginx.conf /etc/nginx/conf.d/default.conf
COPY    ./dist /usr/share/nginx/html
