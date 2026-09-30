As a data platform grows, the hard problems shift from "can we process it?" to "who can see it, can we trust it, and are we allowed to keep it?" **Data governance** covers ownership, quality, discoverability, access and compliance; **security** protects data from misuse and breaches. Both are core responsibilities of senior data engineers.

## Ownership and data products

Every important dataset needs an **owner** (a team, not "the data team") accountable for its quality, documentation and access decisions. Treat key datasets as **data products**: documented, tested, versioned, with defined consumers, freshness guarantees and a support channel.

## The data catalog

A **catalog** makes data discoverable and understandable:

- Table and column descriptions, owners, tags (e.g. `pii`, `finance`, `certified`).
- **Lineage** — where a table's data comes from and what depends on it, down to column level.
- Usage statistics and popular queries.
- Quality and freshness status.

Examples: Unity Catalog, DataHub, OpenMetadata, Atlan, Collibra, Alation, AWS Glue Data Catalog, Google Dataplex. dbt docs provide lineage and descriptions for transformation layers.

**Lineage** turns incidents from guesswork into impact analysis: "this source column changed type — here are the 14 models and 3 dashboards affected."

## Access control

### Principles

- **Least privilege** — grant only what each role needs.
- **Role-based access control (RBAC)** — permissions granted to roles (`analyst_finance`, `etl_orders`), roles granted to people/service accounts.
- **Attribute-based access control (ABAC)** — policies driven by tags: "columns tagged `pii` are masked except for role `pii_reader`" — scales better than per-table grants.
- **Separate service identities** for pipelines; no shared personal credentials.
- **Just-in-time / time-limited access** for sensitive data, with approvals.

### Fine-grained controls

```sql
-- Column masking (Snowflake-style syntax)
CREATE MASKING POLICY mask_email AS (val STRING) RETURNS STRING ->
  CASE WHEN CURRENT_ROLE() IN ('PII_READER') THEN val
       ELSE REGEXP_REPLACE(val, '^[^@]+', '*****') END;

ALTER TABLE customers MODIFY COLUMN email SET MASKING POLICY mask_email;

-- Row-level security: regional analysts see only their region
CREATE ROW ACCESS POLICY region_policy AS (region STRING) RETURNS BOOLEAN ->
  CURRENT_ROLE() = 'GLOBAL_ANALYST' OR region = CURRENT_REGION_FOR_USER();
```

Other platforms offer equivalents (BigQuery policy tags and row-level policies, Unity Catalog row filters and column masks, PostgreSQL row-level security).

## Protecting personal data

| Technique | Use |
| --- | --- |
| **Minimisation** | Don't ingest columns you don't need |
| **Masking** | Hide values from most users (partial display) |
| **Pseudonymisation / tokenisation** | Replace identifiers with tokens; keep the mapping in a restricted vault |
| **Hashing (with a secret salt)** | Join on identifiers without exposing them |
| **Aggregation / anonymisation** | Publish only aggregates above minimum group sizes |
| **Encryption** | At rest (platform-managed or customer-managed keys) and in transit (TLS) |

Classify data (public, internal, confidential, restricted/PII) at ingestion and tag it in the catalog so policies apply automatically downstream.

## Compliance

Regulations shape what you can collect, where you store it and how long you keep it:

- **India's DPDP Act**, the EU's **GDPR**, California's **CCPA/CPRA**, sector rules (PCI DSS for card data, HIPAA for health data in the US), and data-residency requirements in several countries.

Engineering implications:

- **Consent and purpose tracking** — use data only for permitted purposes.
- **Right to erasure** — be able to find and delete a person's data across all tables (lineage + keys + table formats with DELETE support + vacuuming old files and backups within policy).
- **Retention policies** — automatically expire data after its retention period (TTL, partition drops).
- **Data residency** — keep regulated data in approved regions.
- **Audit trails** — log who accessed what, when.

## Security of the platform itself

- Private networking for warehouses, lakes and databases; no public buckets.
- Secrets in a secrets manager; rotated credentials; short-lived tokens for services.
- Infrastructure as code (Terraform) with reviewed changes; policy-as-code checks.
- Encrypted, access-controlled backups; tested restores.
- Monitoring and alerting on unusual access (bulk exports, access outside working patterns).
- Dependency and container image scanning for pipeline code.

## Data quality as governance

Governance isn't only about restriction — it's about trust. Certified datasets, documented metric definitions (a semantic layer), data contracts with producers, quality SLAs and visible freshness status make people confident using data.

## A practical governance rollout

1. Inventory critical datasets; assign owners.
2. Classify and tag sensitive data; apply masking and access policies by tag.
3. Put everything in a catalog with descriptions and lineage.
4. Define and monitor quality/freshness SLAs for tier-1 datasets.
5. Automate retention and deletion workflows.
6. Review access regularly; audit and alert.

Start with the highest-risk and highest-value data, and automate — manual governance doesn't scale.

## Try it yourself

For a fintech company's warehouse (customers, KYC documents, transactions, marketing events), write a governance plan: data classification per table and column, roles and what each can access, masking and row-level policies, retention periods, how a customer's deletion request would be executed end to end, and which audit reports you would review monthly.
