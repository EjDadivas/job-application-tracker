---
title: WorkOS Vault Gotchas
description: Non-obvious traps for WorkOS encrypted data storage — org scoping, case-sensitive keys, BYOK IAM
type: tech
tags: [workos, vault, encryption, security]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-vault.md
aliases: ["WorkOS Vault Gotchas"]
---

# WorkOS Vault Gotchas

Docs:
- https://workos.com/docs/vault/quick-start
- https://workos.com/docs/vault/byok

## Gotchas

- **BYOK requires customer-side IAM permissions** granting WorkOS access to their KMS. Your app cannot do this programmatically — provide customers with IAM policy templates from the BYOK docs.
- **Vault encrypts data per WorkOS organization.** Every operation requires an `organization_id` — there is no global/unscoped access.
- **Do NOT use internal customer IDs as `organization_id`.** WorkOS organization IDs have format `org_*`. Always map through WorkOS APIs.
- **Key context metadata is NOT encrypted separately.** Do not store sensitive data or PII in metadata fields.
- **Vault keys are case-sensitive.** Mismatched casing between store and retrieve silently returns "key not found."
- **BYOK KMS IAM changes can take 5-10 minutes to propagate.** Customer must grant `kms:Decrypt` and `kms:Encrypt` on their key.

## Endpoints

| Endpoint                | Description                    |
| ----------------------- | ------------------------------ |
| `/vault`                | Vault overview                 |
| `/key/create-data-key`  | Create data key                |
| `/key/decrypt-data`     | Decrypt data                   |
| `/key/encrypt-data`     | Encrypt data                   |
| `/object/create`        | Create vault object            |
| `/object/delete`        | Delete vault object            |
| `/object/get`           | Get vault object               |
| `/object/get-by-name`   | Get vault object by name       |
| `/object/list`          | List vault objects             |
| `/object/update`        | Update vault object            |
| `/object/versions`      | List vault object versions     |

## See also

- [[WorkOS Management CLI]] — `workos vault list/get/create` commands
