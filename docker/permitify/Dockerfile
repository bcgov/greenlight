FROM andrewwhitehead/von-image:py36-indy1.3.1-dev-441-ew-s2i

# The indy user has already been setup for us at this point.
ADD --chown=indy:indy ./src/requirements.txt $HOME/
ADD --chown=indy:indy ./src $HOME
ADD --chown=indy:indy ./site_templates $HOME/site_templates
ADD --chown=indy:indy ./docker/docker-entrypoint.sh /usr/local/bin/enter

RUN pip install -r requirements.txt

ENTRYPOINT ["enter"]