---
title: WorkOS Management CLI
description: WorkOS CLI command reference — orgs, users, roles, webhooks, seeding, debugging
type: tech
tags: [workos, cli, management, devops]
created: 2026-04-24
updated: 2026-04-24
related: [[workos-authkit-integration]], [[WorkOS RBAC Gotchas]]
source: devkit/raw/workos/plugins/workos/skills/workos/references/workos-management.md
aliases: ["WorkOS Management CLI"]
---

# WorkOS Management CLI

Authenticate via `workos auth login` or `WORKOS_API_KEY` env var. All commands support `--json` for structured output.

## Quick Reference

| Task                   | Command                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| List organizations     | `workos organization list`                                                   |
| Create organization    | `workos organization create "Acme Corp" acme.com:verified`                   |
| List users             | `workos user list --email=alice@acme.com`                                    |
| Create permission      | `workos permission create --slug=read-users --name="Read Users"`             |
| Create role            | `workos role create --slug=admin --name=Admin`                               |
| Assign perms to role   | `workos role set-permissions admin --permissions=read-users,write-users`     |
| Create org-scoped role | `workos role create --slug=admin --name=Admin --org=org_xxx`                 |
| Add user to org        | `workos membership create --org=org_xxx --user=user_xxx`                     |
| Send invitation        | `workos invitation send --email=alice@acme.com --org=org_xxx`                |
| Revoke session         | `workos session revoke <sessionId>`                                          |
| Add redirect URI       | `workos config redirect add http://localhost:3000/callback`                  |
| Add CORS origin        | `workos config cors add http://localhost:3000`                               |
| Set homepage URL       | `workos config homepage-url set http://localhost:3000`                       |
| Create webhook         | `workos webhook create --url=https://example.com/hook --events=user.created` |
| List SSO connections   | `workos connection list --org=org_xxx`                                       |
| Store a secret         | `workos vault create --name=api-secret --value=sk_xxx --org=org_xxx`         |
| Generate portal link   | `workos portal generate-link --intent=sso --org=org_xxx`                     |
| Seed environment       | `workos seed --file=workos-seed.yml`                                         |
| Debug SSO              | `workos debug-sso conn_xxx`                                                  |
| Debug directory sync   | `workos debug-sync directory_xxx`                                            |
| Set up an org          | `workos setup-org "Acme Corp" --domain=acme.com --roles=admin,viewer`        |
| Onboard a user         | `workos onboard-user alice@acme.com --org=org_xxx --role=admin`              |

## Workflows

### RBAC Setup

```bash
workos permission create --slug=read-users --name="Read Users"
workos permission create --slug=write-users --name="Write Users"
workos role create --slug=admin --name=Admin
workos role set-permissions admin --permissions=read-users,write-users
workos role create --slug=viewer --name=Viewer
workos role set-permissions viewer --permissions=read-users
```

### Organization Onboarding (one-shot)

```bash
workos setup-org "Acme Corp" --domain=acme.com --roles=admin,viewer
```

### Environment Seeding

Create `workos-seed.yml`:

```yaml
permissions:
  - name: 'Read Users'
    slug: 'read-users'

roles:
  - name: 'Admin'
    slug: 'admin'
    permissions: ['read-users']

organizations:
  - name: 'Test Org'
    domains: ['test.com']

config:
  redirect_uris: ['http://localhost:3000/callback']
  cors_origins: ['http://localhost:3000']
  homepage_url: 'http://localhost:3000'
```

```bash
workos seed --file=workos-seed.yml   # Create resources
workos seed --clean                  # Tear down
```

### Local Dev Setup

```bash
workos config redirect add http://localhost:3000/callback
workos config cors add http://localhost:3000
workos config homepage-url set http://localhost:3000
```

## `--json` for Structured Output

```bash
# Get organization ID
workos organization list --json | jq '.data[0].id'

# Chain: create org then add domain
ORG_ID=$(workos organization create "Acme" --json | jq -r '.data.id')
workos org-domain create acme.com --org=$ORG_ID
```

JSON output format:
- **List commands**: `{ "data": [...], "listMetadata": { "before": null, "after": "cursor" } }`
- **Get commands**: Raw object (no wrapper)
- **Create/Update/Delete**: `{ "status": "ok", "message": "...", "data": {...} }`
- **Errors**: `{ "error": { "code": "...", "message": "..." } }` on stderr

## Dashboard-Only (Cannot Use CLI)

- Enable/disable auth methods — Dashboard > Authentication
- Configure session lifetime — Dashboard > Authentication > Sessions
- Set up social login providers — Dashboard > Authentication > Social
- Configure branding — Dashboard > Branding
- Set up email templates — Dashboard > Email
- Manage billing — Dashboard > Settings > Billing

## Command Reference

| Command               | Subcommands                                                                       |
| --------------------- | --------------------------------------------------------------------------------- |
| `workos organization` | `list`, `get`, `create`, `update`, `delete`                                       |
| `workos user`         | `list`, `get`, `update`, `delete`                                                 |
| `workos role`         | `list`, `get`, `create`, `update`, `delete`, `set-permissions`, `add-permission`  |
| `workos permission`   | `list`, `get`, `create`, `update`, `delete`                                       |
| `workos membership`   | `list`, `get`, `create`, `update`, `delete`, `deactivate`, `reactivate`           |
| `workos invitation`   | `list`, `get`, `send`, `revoke`, `resend`                                         |
| `workos session`      | `list`, `revoke`                                                                  |
| `workos connection`   | `list`, `get`, `delete`                                                           |
| `workos webhook`      | `list`, `create`, `delete`                                                        |
| `workos config`       | `redirect add`, `cors add`, `homepage-url set`                                    |
| `workos portal`       | `generate-link`                                                                   |
| `workos vault`        | `list`, `get`, `get-by-name`, `create`, `update`, `delete`                       |
| `workos seed`         | `--file=<yaml>`, `--clean`                                                        |
| `workos setup-org`    | One-shot org onboarding                                                           |
| `workos onboard-user` | Send invitation + optional wait                                                   |
| `workos debug-sso`    | SSO connection diagnostics                                                        |
| `workos debug-sync`   | Directory sync diagnostics                                                        |

## See also

- [[WorkOS RBAC Gotchas]] — role/permission gotchas
- [[WorkOS Admin Portal Gotchas]] — portal link generation
