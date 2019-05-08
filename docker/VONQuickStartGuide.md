# Quick Start Guide: Running a Complete VON Network

A "complete" VON Network consists of the following components;
- An Indy Ledger Node Pool: [von-network](https://github.com/bcgov/von-network)
- An instance of TheOrgBook: [TheOrgBook](https://github.com/bcgov/TheOrgBook)
- A set of Issuer/Verifier Agents: [GreenLight](https://github.com/bcgov/greenlight)

The following **Quick Start Guide** will have you up and running in no time.  For specific details on the features and operation of the individual components refer to the docker compose documentation of the given projects.  For now, let's get you started with a working set of applications ...

## Quick Start Guide

1. Open shell windows (Git Bash for instance) to your working copies of `.../von-network`, `.../TheOrgBook/docker`, and `.../greenlight/docker`.
2. In turn, run `./manage build` in each of the shell windows.
3. Wait for the builds to complete.
4. From `.../von-network` run `./manage start`, and wait for the von-network components to fully start.
5. Ensure the node pool is running by opening a browser window to http://localhost:9000
6. From `.../TheOrgBook/docker` run `./manage start seed=the_org_book_0000000000000000000`
7. Wait for the TheOrgBook's components to start up.
8. Ensure TheOrgBook is running by opening a browser window to http://localhost:8080/en/home
9.  From `.../greenlight/docker` run `./manage start`
10. Wait for all of the issuer services to start up.
11. Ensure the issuer services are running by opening a browser window to http://localhost:5000/ and checking that all of the Credentials from the pre-configured Agents are listed in the `Credentials` drop-down. As of this writing, their should be 8.
12. You should now be able to browse to http://localhost:5000, select a Credential to get (leave the Organization field blank) and go through the Credential acquisition process(es).

## Hosting from a remote machine

The instructions above provide you with an instance of the applications which are only accessible on the local machine.  What if you want to host the instances on another machine and access them remotely?  Well, you can, however ...  This method is only suitable for development and testing.  It is NOT suitable for any level of production level hosting.  The following instructions are an abbreviated set that only contain the differences to the start commands.

These examples use `192.168.15.117` as the IP address. Replace `192.168.15.117` with the IP address of the machine on which you are hosting the applications.  *You may be able to use the hostname of the machine in place of the IP address.*

1. From `.../von-network` run `./manage start 192.168.15.117 &`, and wait for the von-network components to fully start.
1. From `.../TheOrgBook/docker` run `./manage start seed=the_org_book_0000000000000000000 APPLICATION_URL=http://192.168.15.117:8080 LEDGER_URL=http://192.168.15.117:9000`
1.  From `.../greenlight/docker` run `./manage start APPLICATION_URL=http://192.168.15.117:5000 LEDGER_URL=http://192.168.15.117:9000 TOB_API_URL=http://192.168.15.117:8081/api/v2 TOB_APP_URL=http://192.168.15.117:8080 ENDPOINT_URL=http://192.168.15.117:5000`

## Stopping/Shutting Down

If you are making changes to the configuration and you want to stop, rebuild and continue running the network, use:

```sh
./manage stop
```

That stops GreenLight, but leaves the persistence - notably, the agent wallets - intact.


To stop GreenLight and delete the persistence, use:

```sh
./manage down
```

This command will stop and remove any project related containers and associated volumes. If you do want to run VON again, run the same command for `TheOrgBook` and `von-network` before restarting each per the instructions above. 

## Shells

Depending on what you are doing, you can run the commands in the same shell. For example, if you are developing a new Issuer/Verifier Agent using GreenLight to test it, you can run `von-network`, `TheOrgBook` and `greenlight` in the same shell, and then run your new Agent in another shell.  Since `greenlight` and a new VON-Agent may share environment variables, we do recommend running those in different shells.

When using a single shell for running multiple components, hit `ctrl-c` to get back to the command line from the rolling log. To return to monitoring the log, you can use the command:

```sh
./manage logs
```
