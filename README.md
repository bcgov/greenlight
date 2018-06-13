# permitify-x

This project demonstrates basic application for deploying the [VON-X](https://github.com/PSPC-SPAC-buyandsell/von-x) library, in order to enable issuer registration and credential submission to [TheOrgBook](https://github.com/bcgov/TheOrgBook).
It includes Docker tooling for deployment of the application on gunicorn, behind a Caddy reverse proxy.

To support this application you will need a local `von-network` instance as well as a compatible version of TheOrgBook running.
See the [Quick-Start Guide](https://github.com/bcgov/TheOrgBook/blob/master/docker/README.md#running-a-complete-provisional-von-network) for details.

Once the other components are running, you can build and run this application by executing the following inside the `docker` directory
(assuming Docker and a compatible terminal are installed).

```
./manage.sh build
./manage.sh start
```

The default registration form can then be found at `http://localhost:5000/bcreg/incorporation`
