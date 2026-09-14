---
title: React Email — Constraints & Patterns
description: React Email styling constraints, email client limitations, component structure rules, and Resend integration
type: tech
tags: [react-email, email, styling, resend, templates]

aliases: ["React Email"]
---

# React Email — Constraints & Patterns

## pixelBasedPreset (required)

Email clients don't support `rem` units. Always use `pixelBasedPreset`:

```tsx
import { Tailwind, pixelBasedPreset } from 'react-email';

<Tailwind config={{ presets: [pixelBasedPreset] }}>
  <Head />
  <Body>...</Body>
</Tailwind>
```

`<Head />` must be **inside** `<Tailwind>` when using Tailwind CSS.

## Email client limitations

| Feature | Status | Alternative |
|---------|--------|-------------|
| `rem` units | Not supported | Use `pixelBasedPreset` |
| Flexbox / Grid | Not supported | Use `<Row>` / `<Column>` components or tables |
| Media queries (`sm:`, `md:`) | Not supported | Fixed-width layouts |
| Theme selectors (`dark:`, `light:`) | Not supported | Avoid |
| SVG images | Not supported | PNG or JPEG only |
| WEBP images | Not supported | PNG or JPEG only |
| CSS `border` without style | Broken in many clients | Always add `border-solid` |

## Border rules

Email clients don't inherit border type — always specify it:

```tsx
// Correct
<div className="border border-solid border-gray-300" />

// Single-side border — reset others first
<div className="border-none border-l border-solid border-l-gray-300" />

// Wrong — missing border style
<div className="border border-gray-300" />
```

## Required classes per component

| Component | Required | Why |
|-----------|----------|-----|
| `<Button>` | `box-border` | Prevents padding from overflowing button width |
| `<Hr>` / any border | `border-solid` (or `border-dashed` etc.) | Email clients don't inherit border type |

## Container vs Section

| Component | Role | Rule |
|-----------|------|------|
| `<Container>` | Max-width outer wrapper (`max-width: 37.5em` built-in) | Use **once** per email |
| `<Section>` | Interior content grouping — no built-in max-width | Use for content blocks inside `<Container>` |

## Template structure rules

- `<Preview>` must be the **first element inside `<Body>`**
- `<Head />` must be **inside `<Tailwind>`**, not outside it
- Only include props in `PreviewProps` that the component actually uses

```tsx
export default function InvitationEmail({ name, ctaUrl }: Props) {
  return (
    <Html lang="en">
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Head />
        <Body>
          <Preview>You've been invited to Acme</Preview>
          <Container>
            <Section>
              <Text>Hi {name}</Text>
              <Button href={ctaUrl} className="... box-border">Accept invitation</Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

InvitationEmail.PreviewProps = {
  name: 'Jane Smith',
  ctaUrl: 'https://example.com/invite/123',
} satisfies Props;
```

## Template variable gotcha

**Never** put `{{mustache}}` syntax directly in JSX — it produces invalid output. Use it only in `PreviewProps` for Resend template dashboard previews:

```tsx
// Correct — props in JSX, mustache only in PreviewProps
const EmailTemplate = ({ variableName }: Props) => (
  <h1>Hello, {variableName}!</h1>
);

EmailTemplate.PreviewProps = {
  variableName: '{{variableName}}', // only here
};
```

## Gmail 102KB limit

Gmail clips emails larger than 102KB. Keep templates under this limit.

## Rendering + Resend integration

```tsx
import { render } from 'react-email';
import { InvitationEmail } from './templates/invitation';

// Option 1: pass the React component directly — Resend auto-renders
const { data, error } = await resend.emails.send({
  from: 'Acme <noreply@...>',
  to: [inviteeEmail],
  subject: 'You have been invited',
  react: <InvitationEmail name={name} ctaUrl={ctaUrl} />,
});

// Option 2: pre-render to HTML manually
const html = await render(<InvitationEmail name={name} ctaUrl={ctaUrl} />);
const text = await render(<InvitationEmail name={name} ctaUrl={ctaUrl} />, { plainText: true });
```

Using `react:` (Option 1) is simpler — Resend handles both HTML and plain-text rendering automatically.

## See also

- [[sdk-patterns]] — Resend SDK gotchas, idempotency, error handling
- [[tech/resend/overview]] — project email architecture, template file locations
