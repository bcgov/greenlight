#FROM vonx-base
FROM bcgovimages/von-image:py36-1.6-ew-14

WORKDIR $HOME

ADD config $HOME/config
ADD docker $HOME/docker
ADD dflow-agent/src $HOME/src
ADD dflow-agent/templates $HOME/templates

USER root

# Add the indy user to the root group.
RUN usermod -a -G root indy

ARG client_path="${HOME}/.indy_client"
ARG entrypoint="${HOME}/docker/agent/docker-entrypoint.sh"

ENV HOST_IP 0.0.0.0
ENV HOST_PORT 8000
ENV INDY_GENESIS_PATH "${HOME}/genesis"
ENV RUST_LOG warning
ENV RUST_BACKTRACE full

RUN mkdir -p "${client_path}/wallet" \
    && chown -R indy:root "${HOME}" \
    && chmod -R ug+rw "${HOME}" \
    && chmod ug+x "${entrypoint}"

USER indy

WORKDIR $HOME/src
ENTRYPOINT ["bash", "../docker/agent/docker-entrypoint.sh"]
