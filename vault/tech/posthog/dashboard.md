# PostHog Dashboard Guide for Acme

This guide outlines the recommended dashboards and insights to create in PostHog, combining both behavioral events and Convex data warehouse tables.

---

## Dashboard 1: Executive Overview

**Purpose:** High-level business metrics for stakeholders

### Insights to Create

| Insight | Type | Data Source | Query |
|---------|------|-------------|-------|
| **Total Users** | Number | `users` table | `COUNT(*)` from users |
| **Total Workspaces** | Number | `workspaces` table | `COUNT(*)` from workspaces |
| **Total Projects** | Number | `projects` table | `COUNT(*)` from projects |
| **Total Resources** | Number | `resources` table | `COUNT(*)` from resources |
| **Daily Active Users** | Trend | Events | Unique users with any event, last 30 days |
| **Weekly Active Users** | Trend | Events | Unique users with any event, 7-day rolling |
| **User Growth** | Trend | `users` table | Users by `createdAt` date, cumulative |
| **Workspace Growth** | Trend | Events | `workspace_created` events over time |

### SQL Insights (Data Warehouse)

```sql
-- Active users with workspaces in last 7 days
SELECT COUNT(DISTINCT u._id) as active_users
FROM users u
JOIN workspaceMembers wm ON u._id = wm.userId
JOIN workspaces w ON wm.workspaceId = w._id
WHERE w.updatedAt > NOW() - INTERVAL 7 DAY
```

---

## Dashboard 2: User Onboarding Funnel

**Purpose:** Track user journey from signup to activation

### Funnel Visualization

Create a **Funnel** insight with these steps:
1. **Signed Up** → `users` table entry created (use Pageview to `/onboarding`)
2. **Workspace Created** → `workspace_created` event
3. **Profile Completed** → `profile_completed` event
4. **First Project Created** → `project_created` event
5. **First Resource Added** → `resource_added` event

### Supporting Insights

| Insight | Type | Query |
|---------|------|-------|
| **Onboarding Completion Rate** | Number | Users with `onboardingCompleted = true` / Total users |
| **Profile Completion Rate** | Number | Users with `profileCompleted = true` / Total users |
| **Time to First Workspace** | Trend | Time between user creation and first `workspace_created` |
| **Drop-off by Step** | Bar chart | Show where users abandon onboarding |
| **Users with Avatar** | Pie | `profile_completed` events split by `hasAvatar` property |

### SQL Insight (Data Warehouse)

```sql
-- Onboarding status breakdown
SELECT
  CASE
    WHEN onboardingCompleted = false THEN 'Not Started'
    WHEN profileCompleted = false THEN 'Workspace Only'
    ELSE 'Completed'
  END as status,
  COUNT(*) as user_count
FROM users
GROUP BY 1
```

---

## Dashboard 3: Workspace & Project Analytics

**Purpose:** Understand workspace and project engagement

### Insights to Create

| Insight | Type | Data Source | Description |
|---------|------|-------------|-------------|
| **Workspaces Created** | Trend | `workspace_created` event | Weekly trend |
| **Projects Created** | Trend | `project_created` event | Weekly trend |
| **Project Status Distribution** | Pie | `projects` table | Group by `status` (active/on-hold/completed/archived) |
| **Workspace Status Distribution** | Pie | `workspaces` table | Group by `status` |
| **Projects per Workspace** | Histogram | Data Warehouse | Distribution of project counts |
| **Avg Team Size per Workspace** | Number | `workspaceMembers` table | AVG of members per workspace |
| **Workspaces with Client Members** | Number | Data Warehouse | Workspaces with `role = 'client'` |

### SQL Insights (Data Warehouse)

```sql
-- Projects per workspace distribution
SELECT
  w.name as workspace_name,
  COUNT(p._id) as project_count,
  SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_projects
FROM workspaces w
LEFT JOIN projects p ON w._id = p.workspaceId
GROUP BY w._id, w.name
ORDER BY project_count DESC
```

```sql
-- Team composition by workspace
SELECT
  w.name as workspace_name,
  COUNT(CASE WHEN wm.role = 'owner' THEN 1 END) as owners,
  COUNT(CASE WHEN wm.role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN wm.role = 'member' THEN 1 END) as members,
  COUNT(CASE WHEN wm.role = 'client' THEN 1 END) as clients
FROM workspaces w
LEFT JOIN workspaceMembers wm ON w._id = wm.workspaceId
GROUP BY w._id, w.name
```

---

## Dashboard 4: Resource Usage

**Purpose:** Track resource creation and engagement patterns

### Insights to Create

| Insight | Type | Data Source | Description |
|---------|------|-------------|-------------|
| **Resources Added** | Trend | `resource_added` event | Daily/weekly trend |
| **Resource Type Distribution** | Pie | `resources` table | Group by `type` |
| **Resources by Type Over Time** | Stacked area | `resource_added` event | Break down by `resourceType` property |
| **File Type Breakdown** | Pie | `files` table | Group by `fileType` |
| **Avg File Size** | Number | `files` table | AVG of `fileSize` |
| **Total Storage Used** | Number | `files` table | SUM of `fileSize` |
| **Links by Type** | Pie | `links` table | Group by `linkType` |
| **Auto-detected Links %** | Number | `links` table | % with `autoDetected = true` |
| **Client-Visible Resources** | Trend | `resources` table | Count where `visibleToClient = true` |

### SQL Insights (Data Warehouse)

```sql
-- Resources per project
SELECT
  p.name as project_name,
  COUNT(r._id) as total_resources,
  COUNT(CASE WHEN r.type = 'file' THEN 1 END) as files,
  COUNT(CASE WHEN r.type = 'link' THEN 1 END) as links,
  COUNT(CASE WHEN r.type = 'document' THEN 1 END) as documents,
  COUNT(CASE WHEN r.type = 'canvas' THEN 1 END) as canvases,
  COUNT(CASE WHEN r.type = 'thread' THEN 1 END) as threads
FROM projects p
LEFT JOIN resources r ON p._id = r.projectId
GROUP BY p._id, p.name
ORDER BY total_resources DESC
```

```sql
-- Most used file types
SELECT
  fileType,
  COUNT(*) as count,
  ROUND(AVG(fileSize) / 1024 / 1024, 2) as avg_size_mb
FROM files
GROUP BY fileType
ORDER BY count DESC
LIMIT 10
```

```sql
-- Link sources (domains)
SELECT
  REGEXP_EXTRACT(url, 'https?://([^/]+)') as domain,
  linkType,
  COUNT(*) as count
FROM links
GROUP BY 1, 2
ORDER BY count DESC
LIMIT 20
```

---

## Dashboard 5: Team Collaboration

**Purpose:** Track team invitations, membership, and collaboration

### Insights to Create

| Insight | Type | Data Source | Description |
|---------|------|-------------|-------------|
| **Invitations Sent** | Trend | `team_member_invited` event | Weekly trend |
| **Invitation by Role** | Bar | `team_member_invited` event | Break down by `role` property |
| **Invitation Acceptance Rate** | Funnel | `invitations` table | pending → accepted |
| **Pending Invitations** | Number | `invitations` table | Where `status = 'pending'` |
| **Expired Invitations** | Number | `invitations` table | Where `status = 'expired'` |
| **Avg Members per Project** | Number | `projectMembers` table | AVG count by project |
| **Project Roles Distribution** | Pie | `projectMembers` table | Group by `role` |
| **Thread Activity** | Trend | `messages` table | Messages created over time |

### SQL Insights (Data Warehouse)

```sql
-- Invitation funnel by workspace
SELECT
  w.name as workspace_name,
  COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN i.status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN i.status = 'declined' THEN 1 END) as declined,
  COUNT(CASE WHEN i.status = 'expired' THEN 1 END) as expired
FROM workspaces w
LEFT JOIN invitations i ON w._id = i.workspaceId
GROUP BY w._id, w.name
```

```sql
-- Most active collaborators (by messages)
SELECT
  u.name,
  u.email,
  COUNT(m._id) as message_count
FROM users u
JOIN messages m ON u._id = m.authorId
GROUP BY u._id, u.name, u.email
ORDER BY message_count DESC
LIMIT 20
```

---

## Dashboard 6: Feature Adoption

**Purpose:** Track feature flag rollouts and A/B test results

### Insights for Canvas A/B Test

| Insight | Type | Query |
|---------|------|-------|
| **Canvas Variant Distribution** | Pie | `$feature_flag_called` where `$feature_flag = 'canvas_resource_type'`, split by `$feature_flag_response` |
| **Resource Creation by Variant** | Bar | `resource_added` broken down by `canvas_resource_type` feature flag |
| **Canvas Adoption** | Number | `resource_added` where `resourceType = 'canvas'` |
| **Canvas Users** | Number | Unique users who created a canvas |

### Insights for Client Visibility Flag

| Insight | Type | Query |
|---------|------|-------|
| **Client Visibility Enabled %** | Number | `$feature_flag_called` where flag = `enable_client_visibility`, % with true response |
| **Client-Visible Resources** | Trend | `resources` table where `visibleToClient = true` |
| **Client Visibility Usage** | Number | Resources marked visible / total resources |

### SQL Insights (Data Warehouse)

```sql
-- Canvas adoption metrics
SELECT
  DATE_TRUNC('week', FROM_UNIXTIME(r.updatedAt / 1000)) as week,
  COUNT(CASE WHEN r.type = 'canvas' THEN 1 END) as canvas_count,
  COUNT(*) as total_resources,
  ROUND(100.0 * COUNT(CASE WHEN r.type = 'canvas' THEN 1 END) / COUNT(*), 2) as canvas_pct
FROM resources r
GROUP BY 1
ORDER BY 1
```

---

## Dashboard 7: Contacts & CRM

**Purpose:** Track contact management usage

### Insights to Create

| Insight | Type | Data Source | Description |
|---------|------|-------------|-------------|
| **Total Contacts** | Number | `contacts` table | COUNT(*) |
| **Contacts per Workspace** | Bar | `contacts` table | GROUP BY workspaceId |
| **Contacts with Company** | Pie | `contacts` table | Has company vs no company |
| **Contacts with Notes** | Number | `contacts` table | % with notes filled |
| **Contact Completeness** | Bar | `contacts` table | % of fields filled per contact |

### SQL Insights (Data Warehouse)

```sql
-- Contact completeness score
SELECT
  w.name as workspace_name,
  COUNT(c._id) as total_contacts,
  ROUND(100.0 * COUNT(CASE WHEN c.email IS NOT NULL THEN 1 END) / COUNT(*), 1) as has_email_pct,
  ROUND(100.0 * COUNT(CASE WHEN c.phone IS NOT NULL THEN 1 END) / COUNT(*), 1) as has_phone_pct,
  ROUND(100.0 * COUNT(CASE WHEN c.company IS NOT NULL THEN 1 END) / COUNT(*), 1) as has_company_pct,
  ROUND(100.0 * COUNT(CASE WHEN c.role IS NOT NULL THEN 1 END) / COUNT(*), 1) as has_role_pct
FROM workspaces w
LEFT JOIN contacts c ON w._id = c.workspaceId
GROUP BY w._id, w.name
```

---

## Dashboard 8: Tags & Organization

**Purpose:** Track tag usage and resource organization

### Insights to Create

| Insight | Type | Data Source | Description |
|---------|------|-------------|-------------|
| **Tags Created** | Trend | `tag_created` event | Weekly trend |
| **Total Tags** | Number | `tags` table | COUNT(*) |
| **Tags per Project** | Histogram | `tags` table | Distribution |
| **Tag Assignment Rate** | Number | `tag_assigned` events vs `resource_added` | % of resources tagged |
| **Most Used Tags** | Table | Data Warehouse | Top tags by assignment count |
| **Untagged Resources** | Number | `resources` table | Where `tagIds` is empty |

### SQL Insights (Data Warehouse)

```sql
-- Most used tags across all projects
SELECT
  t.name as tag_name,
  t.color,
  p.name as project_name,
  COUNT(*) as usage_count
FROM tags t
JOIN projects p ON t.projectId = p._id
JOIN resources r ON ARRAY_CONTAINS(r.tagIds, t._id)
GROUP BY t._id, t.name, t.color, p.name
ORDER BY usage_count DESC
LIMIT 20
```

```sql
-- Tag coverage per project
SELECT
  p.name as project_name,
  COUNT(r._id) as total_resources,
  COUNT(CASE WHEN ARRAY_LENGTH(r.tagIds) > 0 THEN 1 END) as tagged_resources,
  ROUND(100.0 * COUNT(CASE WHEN ARRAY_LENGTH(r.tagIds) > 0 THEN 1 END) / COUNT(*), 1) as tag_coverage_pct
FROM projects p
LEFT JOIN resources r ON p._id = r.projectId
GROUP BY p._id, p.name
ORDER BY tag_coverage_pct
```

---

## Dashboard 9: Error Tracking & Health

**Purpose:** Monitor application health and errors

### Insights to Create

| Insight | Type | Query |
|---------|------|-------|
| **Exceptions Over Time** | Trend | `$exception` events |
| **Exceptions by Type** | Table | `$exception` grouped by `$exception_type` |
| **Most Common Errors** | Table | `$exception` grouped by `$exception_message` |
| **Errors by User** | Table | `$exception` grouped by user |
| **Error Rate** | Number | Exceptions / Total events ratio |
| **Affected Sessions** | Number | Unique sessions with exceptions |

### Error Breakdown Table Columns

- Error message (truncated)
- Count
- First seen
- Last seen
- Affected users count

---

## Dashboard 10: Session Insights (Add Resource Flow)

**Purpose:** Analyze the add-resource modal flow using session recordings

### Insights to Create

| Insight | Type | Query |
|---------|------|-------|
| **Add Resource Sessions** | Number | Sessions with `resource_added` event |
| **Avg Session Duration** | Number | Average length of recorded sessions |
| **Resource Creation Success Rate** | Funnel | Modal opened → resource_added |
| **Drop-off by Resource Type** | Bar | Which resource type has highest abandonment |
| **Time to Complete** | Trend | Time from modal open to resource creation |

### Session Recording Filters

Create saved filters for quick access:

1. **Completed Resource Flows** - Sessions containing `resource_added` event
2. **Abandoned Flows** - Sessions with modal view but no `resource_added`
3. **Canvas Users** - Sessions with `resource_added` where `resourceType = 'canvas'`
4. **File Upload Issues** - Sessions with file upload errors

---

## Data Warehouse Queries for Cross-Entity Analysis

### User Engagement Score

```sql
-- User engagement score based on activity
SELECT
  u._id,
  u.email,
  u.name,
  COUNT(DISTINCT w._id) as workspace_count,
  COUNT(DISTINCT p._id) as project_count,
  COUNT(DISTINCT r._id) as resource_count,
  COUNT(DISTINCT m._id) as message_count,
  (
    COUNT(DISTINCT w._id) * 10 +
    COUNT(DISTINCT p._id) * 5 +
    COUNT(DISTINCT r._id) * 2 +
    COUNT(DISTINCT m._id) * 1
  ) as engagement_score
FROM users u
LEFT JOIN workspaceMembers wm ON u._id = wm.userId
LEFT JOIN workspaces w ON wm.workspaceId = w._id
LEFT JOIN projects p ON w._id = p.workspaceId
LEFT JOIN resources r ON u._id = r.createdBy
LEFT JOIN messages m ON u._id = m.authorId
GROUP BY u._id, u.email, u.name
ORDER BY engagement_score DESC
```

### Project Health Score

```sql
-- Project health based on activity and completeness
SELECT
  p.name,
  p.status,
  w.name as workspace_name,
  COUNT(DISTINCT r._id) as resource_count,
  COUNT(DISTINCT pm._id) as member_count,
  COUNT(DISTINCT t._id) as tag_count,
  CASE
    WHEN p.status = 'completed' THEN 100
    WHEN COUNT(DISTINCT r._id) > 10 AND COUNT(DISTINCT pm._id) > 2 THEN 80
    WHEN COUNT(DISTINCT r._id) > 5 THEN 60
    WHEN COUNT(DISTINCT r._id) > 0 THEN 40
    ELSE 20
  END as health_score
FROM projects p
JOIN workspaces w ON p.workspaceId = w._id
LEFT JOIN resources r ON p._id = r.projectId
LEFT JOIN projectMembers pm ON p._id = pm.projectId
LEFT JOIN tags t ON p._id = t.projectId
GROUP BY p._id, p.name, p.status, w.name
ORDER BY health_score DESC
```

### Workspace Activity Timeline

```sql
-- Last activity per workspace
SELECT
  w.name,
  w.status,
  MAX(p.updatedAt) as last_project_update,
  MAX(r.updatedAt) as last_resource_update,
  GREATEST(MAX(p.updatedAt), MAX(r.updatedAt)) as last_activity
FROM workspaces w
LEFT JOIN projects p ON w._id = p.workspaceId
LEFT JOIN resources r ON p._id = r.projectId
GROUP BY w._id, w.name, w.status
ORDER BY last_activity DESC
```

---

## Implementation Checklist

### Phase 1: Core Dashboards
- [ ] Executive Overview
- [ ] User Onboarding Funnel
- [ ] Resource Usage

### Phase 2: Growth & Engagement
- [ ] Workspace & Project Analytics
- [ ] Team Collaboration
- [ ] Contacts & CRM

### Phase 3: Feature & Experiments
- [ ] Feature Adoption (A/B tests)
- [ ] Tags & Organization

### Phase 4: Operations
- [ ] Error Tracking & Health
- [ ] Session Insights

### PostHog Configuration Steps
1. Go to **Data Warehouse** → Connect Convex source
2. Verify all tables are synced (users, workspaces, projects, resources, etc.)
3. Create each dashboard in order of priority
4. Set up scheduled refresh for data warehouse queries
5. Configure alerts for error spikes and engagement drops

---

## Recommended Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| Error spike | >10 exceptions in 1 hour | Slack/Email |
| Low signups | <5 new users in 24h | Email |
| Onboarding drop-off | Completion rate <50% | Weekly digest |
| Inactive workspaces | No activity in 7 days | Weekly digest |
