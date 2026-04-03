# Dashboard Shell / Default

A page-level shell with a compact sidebar, page header, primary action row, and a grid of content cards.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { AppDashboardShellDefault } from "@dashbase/react/patterns/app/dashboard-shell/default";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { AppDashboardShellDefault, appDashboardShellDefaultAssets } from "@dashbase/react/patterns/app/dashboard-shell/default/manual";
```

## Scope

- Category: `app`
- Family: `dashboard-shell`
- Variant: `default`
- Scope: `page`

## Dependencies

- Components: `badge`, `button`, `card`
- Patterns: none

## Assets

- CSS: `./pattern.css`
- CSS: `dist/components/badge/badge.css`
- CSS: `dist/components/button/button.css`
- CSS: `dist/components/card/card.css`

## Usage

```tsx
import { AppDashboardShellDefault } from "@dashbase/react/patterns/app/dashboard-shell/default";

export function Example() {
  return (
    <AppDashboardShellDefault />
  );
}
```

## Rendered Structure

```tsx
<div className="dashboard-shell">
    <aside className="shell-sidebar" aria-label="Workspace navigation">
      <ui-badge className="primary">Workspace</ui-badge>
      <nav aria-label="Primary">
        <ul>
          <li><a href="#" aria-current="page">Overview</a></li>
          <li><a href="#">Projects</a></li>
          <li><a href="#">Approvals</a></li>
          <li><a href="#">Reports</a></li>
          <li><a href="#">Settings</a></li>
        </ul>
      </nav>
    </aside>

    <main className="shell-main">
      <header className="shell-header">
        <div className="shell-copy">
          <h1>Operations Dashboard</h1>
          <p>Track launches, triage pending approvals, and keep the team aligned on the latest delivery status.</p>
        </div>

        <div className="shell-actions">
          <button className="ghost" type="button">Share</button>
          <button className="primary" type="button">Create report</button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Key metrics">
        <article className="card">
          <header>
            <ui-badge className="neutral">Health</ui-badge>
            <h2>Release readiness</h2>
          </header>
          <card-content className="metric">
            <strong>82%</strong>
            <p>Three launch blockers remain, all already assigned to owners.</p>
          </card-content>
        </article>

        <article className="card">
          <header>
            <ui-badge className="primary">Approvals</ui-badge>
            <h2>Pending reviews</h2>
          </header>
          <card-content className="metric">
            <strong>14</strong>
            <p>Five are overdue and should be escalated before the end of the day.</p>
          </card-content>
        </article>

        <article className="card">
          <header>
            <ui-badge className="success">Velocity</ui-badge>
            <h2>Completed this week</h2>
          </header>
          <card-content className="metric">
            <strong>37</strong>
            <p>Delivery throughput is up 9% compared with the previous week.</p>
          </card-content>
        </article>
      </section>
    </main>
  </div>
```
