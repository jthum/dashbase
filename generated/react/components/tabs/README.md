# Tabs

Uses ui-tabs, tab-list, and tab-panel anatomy with ARIA roles, authored hidden panels, and a small shim for keyboard navigation and selection sync.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/react/tabs";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent, tabsAssets } from "@dashbase/react/tabs/manual";
```

## Anatomy

- `Tabs` renders `<ui-tabs>`
- `TabsList` renders `<tab-list>`
- `TabsTrigger` renders `<button>`
- `TabsContent` renders `<tab-panel>`

## Assets

- CSS: `dist/components/tabs/tabs.css`
- JS: `dist/components/tabs/tabs.js`

## Variants

- `vertical` adds `.vertical` on `root`
- `orientation` maps to `aria-orientation` on `list`

## Adapter Props

- `orientation` maps to `aria-orientation` on `list` (`horizontal`, `vertical`)

## State Surface

- `aria-selected` on `tab` ("true", "false")
- `hidden` on `panel`
- `aria-disabled` on `tab` ("true", "false")

## Examples

### Horizontal tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/react/tabs";

export function HorizontalTabsExample() {
  return (
    <>
      <Tabs>
              <TabsList role="tablist" aria-label="Workspace sections">
                <button role="tab" id="workspace-tab-account" aria-controls="workspace-panel-account" aria-selected="true">Account</button>
                <button role="tab" id="workspace-tab-billing" aria-controls="workspace-panel-billing" aria-selected="false">Billing</button>
                <button role="tab" id="workspace-tab-members" aria-controls="workspace-panel-members" aria-selected="false">Members</button>
              </TabsList>
      
              <TabsContent id="workspace-panel-account" role="tabpanel" aria-labelledby="workspace-tab-account">
                <p>Manage the workspace profile, primary contact, and notification preferences from one place.</p>
      
                <div className="stats">
                  <div><strong>3</strong><br />admins</div>
                  <div><strong>12</strong><br />members</div>
                  <div><strong>UTC+5:30</strong><br />timezone</div>
                </div>
              </TabsContent>
      
              <TabsContent id="workspace-panel-billing" role="tabpanel" aria-labelledby="workspace-tab-billing" hidden>
                <p>Review invoices, seat count, and the current renewal schedule before the next billing cycle.</p>
                <div className="actions">
                  <button>View invoices</button>
                  <button className="ghost">Update card</button>
                </div>
              </TabsContent>
      
              <TabsContent id="workspace-panel-members" role="tabpanel" aria-labelledby="workspace-tab-members" hidden>
                <p>Invite teammates, review permissions, and promote or demote roles without leaving the current page.</p>
                <div className="actions">
                  <button className="primary">Invite teammate</button>
                  <button className="ghost">Export members</button>
                </div>
              </TabsContent>
            </Tabs>
    </>
  );
}
```

### Vertical tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@dashbase/react/tabs";

export function VerticalTabsExample() {
  return (
    <>
      <Tabs className="vertical">
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
    </>
  );
}
```
