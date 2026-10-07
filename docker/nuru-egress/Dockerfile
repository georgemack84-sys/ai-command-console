FROM alpine:3.21

RUN apk add --no-cache squid
COPY squid.conf /etc/squid/squid.conf
COPY allowed-domains.txt /etc/squid/allowed-domains.txt
RUN mkdir -p /var/cache/squid /var/run/squid \
  && chown -R squid:squid /var/cache/squid /var/run/squid /etc/squid

EXPOSE 3128
USER squid
CMD ["squid", "-N", "-f", "/etc/squid/squid.conf"]
