If GreenLight is to be decoupled from TheOrgBook, there are a few changes that will need to be made. This is a rough list of expected changes to help you get started.

- On boot, GreenLight publishes unpublished schemas and claim definitions found in the configuration files. This is good but it also registers itself with TheOrgBook which will need to be trimmed out. - https://github.com/bcgov/greenlight/blob/master/src/von_connector/apps.py


### Current Claims Exchange API

This is a provisional implementation that will likely evolve over time.
You may want to change this for your implementation.

1. Make a claim offer to the holder.

`POST <TheOrgBook>/bcovrin/generate-claim-request`

```json
{
  "did": <issuer did>,
  "seqNo": <schema sequence number>,
  "claim_def": <claim definition json>
}
```

returns `claim request json`

2. Send claim to holder.

`POST <TheOrgBook>/bcovrin/store-claim`

```json
{
  "claim_type": <relevant schema name>,
  "claim_data": <claim json>
}
```

3. Send proof request

`POST /bcovrin/construct-proof`

```json
{
  "filters": <object of filters>,
  "proof_request": <proof request json>
}
```

### Important Files

- https://github.com/bcgov/greenlight/blob/master/src/von_connector/apps.py
- https://github.com/bcgov/greenlight/blob/master/src/von_connector/schema.py
- https://github.com/bcgov/greenlight/blob/master/src/von_connector/proof.py
- https://github.com/bcgov/greenlight/blob/master/src/greenlight/views.py
- https://github.com/bcgov/greenlight/tree/master/site_templates
