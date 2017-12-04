FROM python:3.6

ADD ./src /app
ADD ./docker-entrypoint.sh /usr/local/bin/enter
WORKDIR /app

RUN pip install -r requirements.txt
