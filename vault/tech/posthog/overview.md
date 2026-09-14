# PostHog Integration Guide

This document provides detailed documentation on how PostHog is integrated into the Acme application.

## Overview

Acme is a secure client management platform that uses PostHog for:

- **Product Analytics**: Track user behavior and custom events
- **Error Tracking**: Capture and monitor exceptions
- **Feature Flags**: Control feature rollouts and A/B testing
- **Experiments**: Run statistically-validated A/B tests backed by multivariate feature flags
- **Session Recording**: Replay user sessions for debugging and UX analysis

## Code Navigation

The codebase uses `// MARK: PostHog` comments to organize PostHog-related code sections. Use your IDE's symbol navigation (Cmd+Shift+O in VS Code) or search for `// MARK: PostHog` to quickly jump to specific implementations:

| Mark | File | Description |
|------|------|-------------|
| `// MARK: PostHog - Provider Setup` | `src/router.tsx` | PostHog provider configuration |
| `// MARK: PostHog - Session Recording Configuration` | `src/router.tsx` | Privacy controls and masking options |
| `// MARK: PostHog - User Identification` | `src/lib/posthog.ts` | usePostHogIdentify hook |
| `// MARK: PostHog - Reset Function` | `src/lib/posthog.ts` | usePostHogReset for sign out |
| `// MARK: PostHog - Custom Events` | `src/lib/posthog.ts` | usePostHogCapture hook |
| `// MARK: PostHog - Identify User` | `src/routes/dashboard/route.tsx` | User identification call |
| `// MARK: PostHog - Track Workspace Created` | `src/routes/onboarding/index.tsx` | Workspace creation event |
| `// MARK: PostHog - Track Profile Completed` | `src/routes/onboarding/complete-profile.tsx` | Profile completion event |
| `// MARK: PostHog - Track Resource Added` | `file-upload-form.tsx`, `add-link-form.tsx`, `add-canvas-form.tsx` | Resource tracking |
| `// MARK: PostHog - Feature Flag (Client Visibility)` | `-resource-card.tsx`, `add-link-form.tsx`, `file-upload-form.tsx` | Boolean flag gating client badge |
| `// MARK: PostHog - Feature Flag (Canvas)` | `resource-type-selector.tsx` | Multivariate flag gating canvas option |
| `// MARK: PostHog - Feature Flag (Announcement)` | `dashboard/index.tsx` | Remote config announcement banner |
| `// MARK: PostHog - Session Recording` | `add-resource-modal.tsx` | Manual start/stop recording for add-resource flow |

## Provider Setup

The PostHog provider is configured in `src/router.tsx`:

```tsx
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";

<PostHogProvider
  apiKey={import.meta.env.VITE_POSTHOG_API_KEY}
  options={{
    api_host: "https://us.i.posthog.com",
    defaults: import.meta.env.VITE_POSTHOG_DEFAULT_FLAGS,

    // Automatic error tracking configuration
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },

    // Session recording privacy controls
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
      },
      maskInputFn: (text, element) => {
        if (element?.attributes["type"]?.value === "search") {
          return text;
        }
        return "*".repeat(text.length);
      },
    },

    // Disable auto-start for manual session recording control
    disable_session_recording: true,
  }}
>
  <PostHogErrorBoundary fallback={<div>Error in PostHog</div>}>
    {/* App content */}
  </PostHogErrorBoundary>
</PostHogProvider>
```

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `capture_exceptions` | Enables automatic capture of unhandled errors and promise rejections |
| `session_recording.maskAllInputs` | Masks all input fields for privacy |
| `session_recording.maskInputOptions.password` | Always mask password fields |
| `disable_session_recording` | Prevents auto-start; use `startSessionRecording()` for manual control |

### PostHogErrorBoundary

Wrapping your app with `PostHogErrorBoundary` catches React rendering errors and reports them to PostHog automatically.

## User Identification

User identification is handled in `src/lib/posthog.ts` using WorkOS AuthKit for authentication:

```tsx
import { usePostHog } from "@posthog/react";

interface User {
  _id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  createdAt: number;
  onboardingCompleted: boolean;
  profileCompleted?: boolean;
}

export function usePostHogIdentify(user: User | null | undefined) {
  const posthog = usePostHog();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !posthog) return;

    // Only identify once per user session
    if (identifiedRef.current === user._id && posthog._isIdentified()) return;

    posthog.identify(user._id, {
      email: user.email,
      name:
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: new Date(user.createdAt).toISOString(),
      onboardingCompleted: user.onboardingCompleted,
      profileCompleted: user.profileCompleted,
    });

    identifiedRef.current = user._id;
  }, [user, posthog]);
}
```

### Usage in Dashboard

The `usePostHogIdentify` hook is called in the dashboard layout (`src/routes/dashboard/route.tsx`):

```tsx
import { usePostHogIdentify } from "#/lib/posthog";

function DashboardLayout() {
  const { data: currentUser } = useQuery(
    convexQuery(api.functions.<entity>.getCurrentUser, {}),
  );

  usePostHogIdentify(currentUser);

  // ...
}
```

### User Properties Tracked

| Property | Description |
|----------|-------------|
| `email` | User's email address |
| `name` | Full name (computed from firstName + lastName) |
| `firstName` | User's first name |
| `lastName` | User's last name |
| `createdAt` | Account creation timestamp (ISO format) |
| `onboardingCompleted` | Whether user completed workspace setup |
| `profileCompleted` | Whether user completed profile setup |

### Key Methods

| Method | Description |
|--------|-------------|
| `posthog.identify(userId, properties)` | Associates events with a specific user |
| `posthog.reset()` | Clears user identity on sign out |

## Event Tracking

Custom events are tracked using the `usePostHogCapture` hook from `src/lib/posthog.ts`:

### Usage Example

```tsx
import { usePostHogCapture } from "#/lib/posthog";

function CreateWorkspaceForm() {
  const { captureWorkspaceCreated } = usePostHogCapture();

  const onSubmit = async (value) => {
    await createWorkspace(value);

    captureWorkspaceCreated({
      workspaceName: value.name,
      hasDescription: !!value.description,
      isFirstWorkspace: true,
    });
  };
}
```

### Capturing Exceptions

```tsx
import { usePostHog } from "@posthog/react";

function SomeComponent() {
  const posthog = usePostHog();

  const handleOperation = async () => {
    try {
      await someOperation();
    } catch (error) {
      posthog?.captureException(error as Error, {
        operation: "create_project",
        project_id: projectId,
        workspace_id: workspaceId,
      });
    }
  };
}
```

### Events Reference

| Event | Description | Properties |
|-------|-------------|------------|
| `workspace_created` | User creates a workspace | `workspaceName`, `hasDescription`, `color`, `isFirstWorkspace` |
| `profile_completed` | User completes profile | `hasAvatar`, `isInvitedUser` |
| `resource_added` | Resource added to project | `resourceType`, `projectId`, `fileType`, `fileSize` |
| `project_created` | User creates a project | `projectName`, `workspaceId`, `hasDescription`, `hasClient` |
| `project_status_changed` | Project status updated | `projectId`, `oldStatus`, `newStatus` |
| `team_member_invited` | Team member invitation sent | `role`, `invitationType` |
| `link_created` | Link resource created | `linkType`, `domain`, `autoDetected` |
| `resource_visibility_changed` | Resource visibility toggled | `resourceId`, `resourceType`, `visibleToClient` |

## Feature Flags

Feature flags allow controlled rollouts and A/B testing. Acme uses three types of feature flags:

### Boolean Flag: `enable_client_visibility`

Gates the "Client" visibility badge and toggle on resource cards. When the flag is off, the client-sharing indicator is hidden from all users. When on, team members can mark resources as visible to clients.

| Flag Key | Type | Default | Location |
|----------|------|---------|----------|
| `enable_client_visibility` | Boolean | Off | `-resource-card.tsx`, `add-link-form.tsx`, `file-upload-form.tsx` |

**File:** `src/routes/dashboard/projects/$id/-resource-card.tsx`

```tsx
import { useFeatureFlagEnabled } from "@posthog/react";

export function ResourceCard({ visibleToClient = false, ...props }: ResourceCardProps) {
  // MARK: PostHog - Feature Flag (Client Visibility)
  const isClientVisibilityEnabled = useFeatureFlagEnabled("enable_client_visibility");

  return (
    <Card>
      {/* ...card content... */}
      <CardFooter>
        {isClientVisibilityEnabled && visibleToClient && (
          <div className="flex items-center gap-1 text-emerald-500">
            <Eye className="w-3 h-3" />
            <span className="text-[10px] font-semibold uppercase">Client</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
```

**PostHog setup:**

1. Go to **Feature Flags** > **New** > **Boolean flag**
2. Set key to `enable_client_visibility`
3. Set rollout to 0% initially (flag disabled by default)
4. When ready to roll out, increase to 100% or target specific users/groups

### Multivariate Flag: `canvas_resource_type`

Gates the Canvas option in the resource type selector. Users in the `control` group do not see the Canvas option; users in `show-canvas` see all four resource types.

| Flag Key | Variants | Rollout | Location |
|----------|----------|---------|----------|
| `canvas_resource_type` | `control`, `show-canvas` | 50% / 50% | `resource-type-selector.tsx` |

**File:** `src/routes/dashboard/projects/$id/-add-resource/resource-type-selector.tsx`

```tsx
import { useFeatureFlagVariantKey } from "@posthog/react";

export function ResourceTypeSelector({ onSelect, onCancel }: ResourceTypeSelectorProps) {
  // MARK: PostHog - Feature Flag (Canvas)
  const canvasVariant = useFeatureFlagVariantKey("canvas_resource_type");

  const filteredTypes =
    canvasVariant === "show-canvas"
      ? resourceTypes
      : resourceTypes.filter((t) => t.id !== "canvas");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        {filteredTypes.map((type) => (
          // ...render each type
        ))}
      </div>
    </div>
  );
}
```

**PostHog setup:**

1. Go to **Feature Flags** > **New** > **Multivariate flag**
2. Set key to `canvas_resource_type`
3. Add variants: `control` (50%) and `show-canvas` (50%)
4. Set release conditions (e.g., 100% of users)

### Remote Config Flag: `dashboard_announcement`

Drives a dynamic announcement banner on the dashboard home page. Change the message or toggle the flag off in PostHog without deploying code.

| Flag Key | Payload type | Location |
|----------|--------------|----------|
| `dashboard_announcement` | JSON object | `dashboard/index.tsx` |

**Payload shape:**

```json
{
  "message": "We just launched Canvas — try creating a whiteboard in any project!",
  "type": "info"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | Yes | The banner text displayed on the dashboard |
| `type` | `string` | No | Styling variant: `"info"`, `"warning"`, `"success"` (defaults to `"info"`) |

**File:** `src/routes/dashboard/index.tsx`

```tsx
import { useFeatureFlagPayload } from "@posthog/react";
import { Megaphone } from "lucide-react";

function DashboardIndex() {
  // MARK: PostHog - Feature Flag (Announcement)
  const announcement = useFeatureFlagPayload("dashboard_announcement") as {
    message: string;
    type?: "info" | "warning" | "success";
  } | null;

  return (
    <div className="flex-1 p-8 lg:p-12">
      {announcement?.message && (
        <section className="mb-8">
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm font-medium">
            <Megaphone className="w-5 h-5 shrink-0" />
            <p>{announcement.message}</p>
          </div>
        </section>
      )}

      {/* Pinned Workspaces, Recently Visited, etc. */}
    </div>
  );
}
```

**PostHog setup:**

1. Go to **Feature Flags** > **New** > **Remote config**
2. Set key to `dashboard_announcement`
3. Set the JSON payload (see shape above)
4. Toggle on/off to show or hide the banner instantly

### Creating Feature Flags

1. Go to PostHog Dashboard > Feature Flags
2. Click **New** and choose the flag type (Boolean, Multivariate, or Remote config)
3. Set the flag key (must match the key used in code)
4. Configure rollout percentage and/or targeting rules
5. Save — the flag is immediately available via React hooks

## Experiments (A/B Testing)

PostHog Experiments let you measure whether a feature flag variant actually improves user behaviour. An experiment is backed by a **multivariate feature flag** — the flag controls who sees what, and the experiment collects the metrics to determine a winner.

Our `canvas_resource_type` multivariate flag is already wired up in the codebase, making it a perfect candidate for a real experiment.

### How the existing code ties in

```tsx
// MARK: PostHog - Feature Flag (Canvas)
const canvasVariant = useFeatureFlagVariantKey("canvas_resource_type");
const showCanvas = canvasVariant === "show-canvas";
```

PostHog automatically fires a `$feature_flag_called` event every time this hook resolves. That event is the default **exposure trigger** for experiments — no extra code needed.

---

### Creating the experiment in PostHog

Go to **[PostHog → Experiments](https://app.posthog.com/experiments)** and click **New experiment**. The wizard has three steps.

#### Step 1 — Description

| Field | What to enter |
|-------|---------------|
| **Name** | `Canvas Resource Type A/B Test` |
| **Hypothesis** | `Showing the Canvas option increases resource creation by giving users a visual brainstorming tool.` |
| **Feature flag key** | Click **Select existing flag** and choose `canvas_resource_type` |

> Using **Select existing flag** is important here because the flag already exists in PostHog and is already being evaluated in production code. If you let the wizard create a new flag, you'll have a duplicate.

The existing flag must have `control` as its first variant. Our `canvas_resource_type` flag already uses `control` as the baseline variant, so no changes are needed before linking it.

#### Step 2 — Variant rollout

| Setting | Value |
|---------|-------|
| **Variants** | `control` (canvas hidden), `show-canvas` (canvas visible) |
| **Traffic split** | 50% / 50% |
| **Rollout percentage** | 100% (or lower if you want a limited rollout) |
| **Participant type** | User (default) |

Because you're linking an existing flag, this step is **read-only** — variant changes must be made from the flag's own settings page.

The **Traffic preview** bar shows the actual bucketing distribution. Increasing the rollout percentage does not re-assign already-bucketed users.

#### Step 3 — Analytics

**Inclusion criteria**

Leave this as the default (`$feature_flag_called` for `canvas_resource_type`). Every time `useFeatureFlagVariantKey("canvas_resource_type")` is evaluated, PostHog records exposure automatically.

**Primary metric — engagement goal**

| Field | Value |
|-------|-------|
| **Metric type** | Unique users |
| **Event** | `resource_added` |
| **Goal** | Increase |

This measures whether seeing the Canvas option leads to users creating more resources.

**Secondary metric (optional) — canvas adoption**

| Field | Value |
|-------|-------|
| **Metric type** | Unique users |
| **Event** | `resource_added` where `resourceType = canvas` |
| **Goal** | Increase |

Click **Save as draft**, then **Launch** from the experiment detail page when you're ready.

---

### Reading results

Once the experiment is running, PostHog shows:

- **Conversion rates** per variant
- **Statistical significance** (95% confidence threshold by default)
- A **winning variant** recommendation when significance is reached

When the experiment concludes, update the feature flag to roll out the winning variant to 100% of users, then archive the experiment.

---

### Code reference

| Hook | Flag key | Variant values |
|------|----------|----------------|
| `useFeatureFlagVariantKey` | `canvas_resource_type` | `control` (canvas hidden), `show-canvas` (canvas visible) |

The resource type selector filters the list based on the variant:

```tsx
const canvasVariant = useFeatureFlagVariantKey("canvas_resource_type");
const filteredTypes =
  canvasVariant === "show-canvas"
    ? resourceTypes
    : resourceTypes.filter((t) => t.id !== "canvas");
```

No additional instrumentation is required — PostHog captures exposure via `$feature_flag_called` automatically.

---

### Adding a new experiment from scratch

1. Go to **Feature Flags → New Feature Flag**
2. Set type to **Multivariate**
3. Add a `control` variant and one or more test variants (e.g., `variant-a`)
4. Save the flag, then go to **Experiments → New Experiment**
5. In Step 1, click **Select existing flag** and choose your new flag
6. Complete Steps 2–3 as above
7. In your component, use `useFeatureFlagVariantKey("your-flag-key")` and branch on the returned string

---

## Session Recording

Session recording is manually controlled for targeted capture of user flows. Auto-recording is disabled (`disable_session_recording: true` in the provider) so that recordings focus on specific user journeys rather than capturing everything.

### Add-Resource Flow Recording

The primary use case for session recording in Acme is the **add-resource flow** — from the moment a user opens the "Add Resource" modal until the resource is successfully created or the modal is dismissed.

**File:** `src/routes/dashboard/projects/$id/add-resource-modal.tsx`

#### Prerequisite: Enable Session Recording in PostHog

`startSessionRecording()` has **no effect** unless Session Recording is enabled at the project level. Go to **[PostHog → Project Settings → Session Recording](https://us.posthog.com)** and toggle it **on**.

#### Starting a Recording

Start recording when the user opens the Add Resource modal. Pass `true` to `startSessionRecording()` to override ingestion controls (sampling, linked flags, etc.) and guarantee the session is captured:

```tsx
import { usePostHog } from "@posthog/react";

export function AddResourceModal() {
  const posthog = usePostHog();
  const [open, onOpenChange] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // MARK: PostHog - Session Recording
      posthog?.startSessionRecording(true);
    } else {
      posthog?.stopSessionRecording();
      setStep("selector");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* ... */}
    </Dialog>
  );
}
```

#### Stopping a Recording

Stop recording when the modal closes — whether the user completed the flow, cancelled, or clicked outside:

```tsx
const handleComplete = () => {
  posthog?.stopSessionRecording();
  onOpenChange(false);
  setStep("selector");
};

const handleCancel = () => {
  if (step === "selector") {
    posthog?.stopSessionRecording();
    onOpenChange(false);
  } else {
    setStep("selector");
  }
};
```

#### Full Implementation

Here is the complete add-resource modal with session recording wired in:

```tsx
import { useState } from "react";
import { usePostHog } from "@posthog/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ResourceTypeSelector } from "./-add-resource/resource-type-selector";
import { FileUploadForm } from "./-add-resource/file-upload-form";
import { AddLinkForm } from "./-add-resource/add-link-form";
import { AddCanvasForm } from "./-add-resource/add-canvas-form";
import { useParams } from "@tanstack/react-router";

type Step = "selector" | "document" | "file" | "link" | "canvas";

export function AddResourceModal() {
  const { id: projectId } = useParams({ from: "/dashboard/projects/$id" });
  const posthog = usePostHog();
  const [step, setStep] = useState<Step>("selector");
  const [open, setOpen] = useState(false);

  // MARK: PostHog - Session Recording
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      posthog?.startSessionRecording(true);
    } else {
      posthog?.stopSessionRecording();
      setStep("selector");
    }
    setOpen(isOpen);
  };

  const handleSelectType = (typeId: string) => {
    setStep(typeId as Step);
  };

  const handleCancel = () => {
    if (step === "selector") {
      handleOpenChange(false);
    } else {
      setStep("selector");
    }
  };

  const handleComplete = () => {
    handleOpenChange(false);
  };

  // ...renderStep(), getTitle(), getDescription()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {getDescription() && (
            <DialogDescription>{getDescription()}</DialogDescription>
          )}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
```

### Why Manual Control?

- **Reduces storage costs** by only recording relevant flows
- **Focuses on specific user journeys** (e.g., resource creation, file uploads)
- **Respects user privacy** by not recording all browsing activity
- **Improves signal-to-noise** — recorded sessions are always actionable

### Privacy Controls

Session recording masking is configured in the provider options:

| Setting | Behaviour |
|---------|-----------|
| `maskAllInputs: true` | All input field values are replaced with asterisks |
| `maskInputOptions.password: true` | Password fields are always masked, regardless of other settings |
| `maskInputFn` custom function | Search inputs are left unmasked; all other inputs are masked |

### Viewing Recordings

1. Go to **[PostHog → Session Recordings](https://app.posthog.com/replay)**
2. Filter by event `resource_added` to find sessions where resources were created
3. Use the timeline to jump to the exact moment the Add Resource modal was opened
4. Look for drop-off patterns — users who opened the modal but didn't complete the flow

## Source Maps

Source maps can be uploaded to PostHog for readable error stack traces. Configure in `vite.config.ts`:

```tsx
import posthog from "@posthog/rollup-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      posthog({
        personalApiKey: env.VITE_POSTHOG_API_KEY,
        projectId: env.VITE_POSTHOG_PROJECT_ID,
        host: env.VITE_POSTHOG_HOST,
        sourcemaps: {
          enabled: true,
          releaseName: "acme",
          releaseVersion: "1.0.0",
          deleteAfterUpload: true,
        },
      }),
    ],
  };
});
```

### Benefits

- Error stack traces show original source code, not minified code
- Easier debugging of production errors
- Source maps are deleted after upload for security

## Adding New Events

### Best Practices

1. **Use snake_case event names**: `workspace_created` not `workspaceCreated`
2. **Use present-tense verbs**: `create`, `submit`, `click` not `created`, `submitted`
3. **Include relevant properties**: Add context that helps analysis
4. **Use is/has prefixes for booleans**: `hasDescription`, `isFirstWorkspace`

### Example: Adding a New Event

```tsx
import { usePostHogCapture } from "#/lib/posthog";

function ProjectSettings() {
  const { captureProjectArchived } = usePostHogCapture();

  const handleArchive = async () => {
    await archiveProject(projectId);

    captureProjectArchived({
      projectId,
      resourceCount: resources.length,
    });
  };
}
```

### Property Guidelines

| Property Type | Example | Use Case |
|---------------|---------|----------|
| IDs | `projectId`, `workspaceId` | Linking events to entities |
| Booleans | `hasDescription`, `isFirstWorkspace` | Feature usage analysis |
| Enums | `resourceType`, `role` | Segmentation and filtering |
| Counts | `fileSize`, `resourceCount` | Aggregate analysis |

## Recommended Events to Add

The following events are recommended for future implementation:

### Project Events

```typescript
captureProjectArchived: (properties: { projectId: string; resourceCount: number }) => void;
captureProjectDeleted: (properties: { projectId: string }) => void;
```

### Team Events

```typescript
captureTeamMemberJoined: (properties: { acceptedInvitation: boolean }) => void;
captureTeamMemberRoleChanged: (properties: { oldRole: string; newRole: string }) => void;
```

### Tag Events

```typescript
captureTagCreated: (properties: { tagName: string; projectId: string }) => void;
captureTagAssigned: (properties: { tagId: string; resourceId: string }) => void;
captureTagRemoved: (properties: { tagId: string; resourceId: string }) => void;
```

## Environment Variables

Required PostHog environment variables:

```env
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_PROJECT_ID=your_project_id
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_DEFAULT_FLAGS=
```

## Resources

- [PostHog React Documentation](https://posthog.com/docs/libraries/react)
- [PostHog Feature Flags](https://posthog.com/docs/feature-flags)
- [PostHog Experiments](https://posthog.com/docs/experiments)
- [PostHog Session Recording](https://posthog.com/docs/session-recording)
- [PostHog Error Tracking](https://posthog.com/docs/error-tracking)
