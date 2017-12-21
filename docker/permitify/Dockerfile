FROM python-libindy:latest

ENV HOME=/app
WORKDIR $HOME

RUN mkdir -p /app/.indy_client/wallet

ADD ./src $HOME
ADD ./site_templates $HOME/site_templates
ADD ./docker/docker-entrypoint.sh /usr/local/bin/enter

RUN pip install -r requirements.txt

RUN chgrp -R 0 $HOME /usr/local/bin /app/.indy_client/wallet \
  && chmod -R g+rwx $HOME /usr/local/bin /app/.indy_client/wallet

USER 10001

ENTRYPOINT ["enter"]