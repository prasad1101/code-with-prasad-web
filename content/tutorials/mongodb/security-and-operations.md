A production database needs more than good queries. This lesson covers securing MongoDB and operating it reliably: authentication, authorisation, encryption, network security, backups, monitoring and upgrades.

## Authentication

Never run a server without authentication. Create an admin user, then enable access control (`security.authorization: enabled` in `mongod.conf`, or `--auth`):

```js
use admin
db.createUser({
  user: 'admin',
  pwd: passwordPrompt(),
  roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }, { role: 'readWriteAnyDatabase', db: 'admin' }],
})
```

Atlas enforces authentication and TLS by default. Supported mechanisms include SCRAM (username/password), X.509 certificates, LDAP/Kerberos (Enterprise) and cloud IAM (AWS IAM, OIDC workload identity on Atlas).

## Authorisation: least privilege

Give each application only the permissions it needs, on only its database:

```js
use shop
db.createUser({ user: 'shopApi', pwd: passwordPrompt(), roles: [{ role: 'readWrite', db: 'shop' }] })
db.createUser({ user: 'reporting', pwd: passwordPrompt(), roles: [{ role: 'read', db: 'shop' }] })
```

Custom roles can restrict actions to specific collections:

```js
db.createRole({
  role: 'ordersWriter',
  privileges: [{ resource: { db: 'shop', collection: 'orders' }, actions: ['find', 'insert', 'update'] }],
  roles: [],
})
```

Separate users for the API, background workers, analysts and administrators make auditing and revocation easier.

## Network security

- **Never expose MongoDB directly to the internet.** Bind to private interfaces (`net.bindIp`) and restrict access with firewalls/security groups — or use Atlas IP access lists, VPC peering or private endpoints.
- Require **TLS** for all connections.
- Unprotected MongoDB instances on the public internet are routinely found and wiped by automated attacks.

## Encryption

- **In transit**: TLS.
- **At rest**: encrypted storage (Atlas encrypts by default; Enterprise supports the encrypted storage engine with key management).
- **Field-level**: **Client-Side Field Level Encryption** and **Queryable Encryption** encrypt sensitive fields (national IDs, health data) in the application, so the database and its admins never see plaintext — Queryable Encryption still allows equality and range queries on them.

## Application-level security

- Validate input and prevent operator injection (see the Express security lesson).
- Keep connection strings in secret managers/environment variables.
- Use schema validation for critical invariants.
- Don't log full documents that contain personal data.

## Auditing

Record who did what: authentication attempts, user/role changes, schema changes and (if required) data access. Atlas and Enterprise provide auditing; Atlas also keeps access and activity logs.

## Backups and recovery

- **Atlas**: continuous cloud backups with point-in-time restore — configure retention to meet your requirements.
- **Self-managed**: filesystem/volume snapshots of a secondary, or Ops Manager/Cloud Manager backups. `mongodump`/`mongorestore` suit small databases and migrations, not large production systems.
- **Test restores regularly.** An untested backup is a hope, not a plan.
- Define **RPO** (how much data you can lose) and **RTO** (how long recovery may take) and design backups to meet them.

## Monitoring

Key metrics:

| Area | Metrics |
| --- | --- |
| Throughput & latency | Operations/s, p95/p99 latency by operation type |
| Resources | CPU, memory, disk IOPS and latency, disk space |
| Cache | WiredTiger cache usage, eviction, dirty data |
| Replication | Replication lag, oplog window, elections |
| Connections | Current vs. available connections |
| Queries | Slow operations, scan-and-order, `COLLSCAN`s |

Use Atlas monitoring, or Prometheus exporters with Grafana for self-managed clusters. Alert on lag, disk space, connection saturation and latency.

## Upgrades and maintenance

- Stay on a supported major version; test upgrades in staging with production-like data.
- Replica sets allow **rolling upgrades**: upgrade secondaries one at a time, step down the primary, then upgrade it — no downtime.
- Build large indexes during low-traffic periods; monitor their impact.
- Keep enough free disk space for compaction and index builds.

## Data lifecycle and compliance

- TTL indexes for data that should expire (sessions, OTPs, temporary logs).
- Archive or delete personal data according to retention policies (e.g. GDPR/DPDP "right to erasure").
- Keep data in the regions required by regulations (Atlas multi-region clusters, zone sharding).

## Production checklist

- [ ] Authentication and TLS enforced; no public exposure
- [ ] Least-privilege users per application
- [ ] Encryption at rest; field-level encryption for sensitive data
- [ ] Backups with tested point-in-time restores
- [ ] Monitoring and alerts for latency, lag, disk and connections
- [ ] Indexes reviewed; slow query profiling enabled
- [ ] Replica set of 3+ members across availability zones
- [ ] Documented upgrade and incident runbooks

## Try it yourself

On a local replica set: enable authentication, create separate `api` (readWrite on `shop`) and `analyst` (read-only) users, confirm the analyst can't insert, take a `mongodump` of `shop`, drop a collection, and restore it with `mongorestore`.
