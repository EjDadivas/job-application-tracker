---
tags: [frontend, tanstack, start, deployment, nitro]
related-skill: tanstack
aliases: ["TanStack Start Deployment"]
---

# TanStack Start Deployment

> **Quick Summary**: Deployment target is a single `server.preset` string in `app.config.ts`. Nitro generates the right output for each platform — Node server, Vercel, Netlify, Cloudflare, AWS Lambda, Deno, Bun. Switch presets without rewriting the app.

## Content

### Supported Platforms (Nitro Presets)

```typescript
// app.config.ts
export default defineConfig({
  server: {
    preset: 'node-server',         // Self-hosted Node.js
    // preset: 'vercel',            // Vercel
    // preset: 'netlify',           // Netlify
    // preset: 'cloudflare-pages',  // Cloudflare Pages
    // preset: 'aws-lambda',        // AWS Lambda
    // preset: 'deno-server',       // Deno Deploy
    // preset: 'bun',               // Bun
  },
})
```

### Picking a preset

| Target | Preset | Notes |
|---|---|---|
| Your own server | `node-server` | Standalone Node entry |
| Vercel | `vercel` | Serverless functions + edge |
| Netlify | `netlify` | Functions + edge |
| Cloudflare Pages | `cloudflare-pages` | Workers runtime — watch for Node-only APIs |
| AWS Lambda | `aws-lambda` | Bundle size matters |
| Deno Deploy | `deno-server` | No npm-only modules |
| Bun | `bun` | Native Bun runtime |

### Runtime considerations

- Cloudflare / Deno / edge presets don't support Node built-ins (`fs`, `crypto` partial) — feature-flag accordingly.
- Serverless presets cold-start — avoid heavy top-level imports in server fns.

## Related Notes

- [[TanStack Start Setup]] — where the `server.preset` field lives
- [[TanStack Start Best Practices]]
