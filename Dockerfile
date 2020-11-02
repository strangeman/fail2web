FROM node:12 as builder

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

FROM nginx:alpine

LABEL maintainer="Mathieu BRUNOT <mathieu.brunot at monogramm dot io>"

ENV FAIL2REST_ADDR=http://localhost:5000/ \
	FAIL2REST_USER=admin.fail2ban \
	FAIL2REST_PASSWD=youshouldoverwritethis \
	FAIL2REST_PASSWD_COST=15 \
	FAIL2REST_PASSWD_ENABLED=1

COPY docker-entrypoint.sh /entrypoint.sh
COPY nginx.vh.default.conf /etc/nginx/conf.d/default.conf

# Install the packages we need
# Make sure the entrypoint is executable
# Get and install fail2web
RUN set -ex; \
	apk add --no-cache \
		apache2-utils \
	; \
	chmod 755 /entrypoint.sh; \
	mkdir -p /var/www/html/

COPY --from=builder /app/web /var/www/html/fail2web

ENTRYPOINT ["/entrypoint.sh"]
