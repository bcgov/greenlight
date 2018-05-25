#FROM vonx-base
FROM bcgovimages/von-image:py36-1.0rc3

WORKDIR $HOME

#ADD --chown=indy:indy src/requirements.txt $HOME/src/
#RUN pip --no-cache-dir install -r src/requirements.txt
RUN pip install git+https://github.com/PSPC-SPAC-buyandsell/von-x.git#master

ADD --chown=indy:indy . $HOME

USER root
ARG client_path="${HOME}/.indy_client"
ARG entrypoint="${HOME}/docker/docker-entrypoint.sh"
RUN mkdir -p "${client_path}/wallet" \
    && chown -R indy:indy "${client_path}" \
    && chmod -R ug+rw "${client_path}" \
    && chmod ug+x "${entrypoint}"
USER indy

ENV HOST_IP 0.0.0.0
ENV HOST_PORT 8000
ENV INDY_GENESIS_PATH "${HOME}/genesis"
ENV RUST_LOG warning
ENV RUST_BACKTRACE full

HEALTHCHECK --interval=60s --timeout=5s --start-period=120s \
	CMD wget -q --spider http://localhost:${HOST_PORT}/health || exit 1

WORKDIR $HOME/src
ENTRYPOINT ["bash", "../docker/docker-entrypoint.sh"]
