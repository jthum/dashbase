# Tabs

Uses ui-tabs, tab-list, and tab-panel anatomy with ARIA roles, authored hidden panels, and a small shim for keyboard navigation and selection sync.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```svelte
<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/svelte/tabs";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsAssets } from "@dashbase/svelte/tabs/manual";
```

## Generated Examples

- `@dashbase/svelte/tabs/examples`

## Adapter Props

- `orientation?: "horizontal" | "vertical"`

## Usage

### Horizontal tabs

```svelte
<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/svelte/tabs";
</script>

<Tabs>
  <TabsList role="tablist" aria-label="Workspace sections">
    <TabsTrigger role="tab" id="workspace-tab-account" aria-controls="workspace-panel-account" aria-selected="true">Account</TabsTrigger>
    <TabsTrigger role="tab" id="workspace-tab-billing" aria-controls="workspace-panel-billing" aria-selected="false">Billing</TabsTrigger>
    <TabsTrigger role="tab" id="workspace-tab-members" aria-controls="workspace-panel-members" aria-selected="false">Members</TabsTrigger>
  </TabsList>

  <TabsContent id="workspace-panel-account" role="tabpanel" aria-labelledby="workspace-tab-account">
    <p>Manage the workspace profile, primary contact, and notification preferences from one place.</p>

    <div class="stats">
      <div><strong>3</strong><br />admins</div>
      <div><strong>12</strong><br />members</div>
      <div><strong>UTC+5:30</strong><br />timezone</div>
    </div>
  </TabsContent>

  <TabsContent id="workspace-panel-billing" role="tabpanel" aria-labelledby="workspace-tab-billing" hidden>
    <p>Review invoices, seat count, and the current renewal schedule before the next billing cycle.</p>
    <div class="actions">
      <TabsTrigger>View invoices</TabsTrigger>
      <TabsTrigger class="ghost">Update card</TabsTrigger>
    </div>
  </TabsContent>

  <TabsContent id="workspace-panel-members" role="tabpanel" aria-labelledby="workspace-tab-members" hidden>
    <p>Invite teammates, review permissions, and promote or demote roles without leaving the current page.</p>
    <div class="actions">
      <TabsTrigger class="primary">Invite teammate</TabsTrigger>
      <TabsTrigger class="ghost">Export members</TabsTrigger>
    </div>
  </TabsContent>
</Tabs>

```

### Vertical tabs

```svelte
<script lang="ts">
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/svelte/tabs";
</script>

<Tabs class="vertical">
  <TabsList role="tablist" aria-label="Project settings" aria-orientation="vertical">
    <TabsTrigger role="tab" id="settings-tab-overview" aria-controls="settings-panel-overview" aria-selected="true">Overview</TabsTrigger>
    <TabsTrigger role="tab" id="settings-tab-security" aria-controls="settings-panel-security" aria-selected="false">Security</TabsTrigger>
    <TabsTrigger role="tab" id="settings-tab-integrations" aria-controls="settings-panel-integrations" aria-selected="false">Integrations</TabsTrigger>
  </TabsList>

  <TabsContent id="settings-panel-overview" role="tabpanel" aria-labelledby="settings-tab-overview">
    <p>Use vertical tabs when the list of sections is longer or when panels hold denser settings content.</p>
  </TabsContent>

  <TabsContent id="settings-panel-security" role="tabpanel" aria-labelledby="settings-tab-security" hidden>
    <p>Review session policies, passkey support, and recovery flows before enabling stricter security defaults.</p>
  </TabsContent>

  <TabsContent id="settings-panel-integrations" role="tabpanel" aria-labelledby="settings-tab-integrations" hidden>
    <p>Connect analytics, notifications, and deployment providers while keeping each section easy to scan.</p>
  </TabsContent>
</Tabs>

```
