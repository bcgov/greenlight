FROM python-libindy:latest

ENV HOME=/app
WORKDIR $HOME
USER root

RUN mkdir -p /app/.indy_client/wallet

ADD ./src/requirements.txt $HOME/src/
RUN pip install -r src/requirements.txt

ADD ./src ./docker/docker-entrypoint.sh $HOME/
ADD ./site_templates $HOME/site_templates

RUN chgrp -R 0 $HOME /usr/local/bin /app/.indy_client/wallet \
	&& chmod -R g+rwx $HOME /usr/local/bin /app/.indy_client/wallet

USER 10001

ENV APPLICATION_IP 0.0.0.0
ENV APPLICATION_PORT 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["sh", "-c", "python3 manage.py runserver ${APPLICATION_IP}:${APPLICATION_PORT}"]
