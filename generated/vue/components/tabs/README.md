# Tabs

Uses ui-tabs, tab-list, and tab-panel anatomy with ARIA roles, authored hidden panels, and a small shim for keyboard navigation and selection sync.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```vue
<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/vue/tabs";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsAssets } from "@dashbase/vue/tabs/manual";
```

## Behavior Hosting

- Generated adapter mode: `browser-shim`
- The default entrypoint auto-imports a browser behavior shim.
- In SSR runtimes, mount this component from a client boundary or after client hydration.
- The shim mutates live DOM state. If the framework starts fighting those mutations, prefer a controller-backed or native override.

## Generated Examples

- `@dashbase/vue/tabs/examples`

## Adapter Props

- `orientation?: "horizontal" | "vertical"`

## Accessibility

- Focus model: `roving-tabindex`
- Required authored attributes on `tab`: `id`, `aria-controls`, `aria-selected`
- Required authored attributes on `panel`: `id`, `aria-labelledby`
- Relationship: `tab` uses `aria-controls` to reference `panel`
- Relationship: `panel` uses `aria-labelledby` to reference `tab`
- Keyboard: `ArrowRight` on `tab` moves focus to the next tab in horizontal tab lists.
- Keyboard: `ArrowLeft` on `tab` moves focus to the previous tab in horizontal tab lists.
- Keyboard: `ArrowDown` on `tab` moves focus to the next tab in vertical tab lists.
- Keyboard: `ArrowUp` on `tab` moves focus to the previous tab in vertical tab lists.
- Keyboard: `Home` on `tab` moves focus to the first tab.
- Keyboard: `End` on `tab` moves focus to the last tab.
- Keyboard: `Enter` on `tab` activates the focused tab and reveals its panel.
- Keyboard: `Space` on `tab` activates the focused tab and reveals its panel.

## Usage

### Horizontal tabs

```vue
<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/vue/tabs";
</script>

<template>
<Tabs>
  <TabsList role="tablist" aria-label="Workspace sections">
    <button role="tab" id="workspace-tab-account" aria-controls="workspace-panel-account" aria-selected="true">Account</button>
    <button role="tab" id="workspace-tab-billing" aria-controls="workspace-panel-billing" aria-selected="false">Billing</button>
    <button role="tab" id="workspace-tab-members" aria-controls="workspace-panel-members" aria-selected="false">Members</button>
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
      <button>View invoices</button>
      <button class="ghost">Update card</button>
    </div>
  </TabsContent>

  <TabsContent id="workspace-panel-members" role="tabpanel" aria-labelledby="workspace-tab-members" hidden>
    <p>Invite teammates, review permissions, and promote or demote roles without leaving the current page.</p>
    <div class="actions">
      <button class="primary">Invite teammate</button>
      <button class="ghost">Export members</button>
    </div>
  </TabsContent>
</Tabs>

</template>
```

### Vertical tabs

```vue
<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/vue/tabs";
</script>

<template>
<Tabs class="vertical">
  <TabsList role="tablist" aria-label="Project settings" aria-orientation="vertical">
    <button role="tab" id="settings-tab-overview" aria-controls="settings-panel-overview" aria-selected="true">Overview</button>
    <button role="tab" id="settings-tab-security" aria-controls="settings-panel-security" aria-selected="false">Security</button>
    <button role="tab" id="settings-tab-integrations" aria-controls="settings-panel-integrations" aria-selected="false">Integrations</button>
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

</template>
```
