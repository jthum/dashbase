<script setup lang="ts">
  import "./pattern.css";
  import "../../../../../../dist/components/badge/badge.css";
  import "../../../../../../dist/components/button/button.css";
  import "../../../../../../dist/components/card/card.css";
</script>

<template>
  <div class="dashboard-shell">
      <aside class="shell-sidebar" aria-label="Workspace navigation">
        <ui-badge class="primary">Workspace</ui-badge>
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
  
      <main class="shell-main">
        <header class="shell-header">
          <div class="shell-copy">
            <h1>Operations Dashboard</h1>
            <p>Track launches, triage pending approvals, and keep the team aligned on the latest delivery status.</p>
          </div>
  
          <div class="shell-actions">
            <button class="ghost" type="button">Share</button>
            <button class="primary" type="button">Create report</button>
          </div>
        </header>
  
        <section class="metrics-grid" aria-label="Key metrics">
          <article class="card">
            <header>
              <ui-badge class="neutral">Health</ui-badge>
              <h2>Release readiness</h2>
            </header>
            <card-content class="metric">
              <strong>82%</strong>
              <p>Three launch blockers remain, all already assigned to owners.</p>
            </card-content>
          </article>
  
          <article class="card">
            <header>
              <ui-badge class="primary">Approvals</ui-badge>
              <h2>Pending reviews</h2>
            </header>
            <card-content class="metric">
              <strong>14</strong>
              <p>Five are overdue and should be escalated before the end of the day.</p>
            </card-content>
          </article>
  
          <article class="card">
            <header>
              <ui-badge class="success">Velocity</ui-badge>
              <h2>Completed this week</h2>
            </header>
            <card-content class="metric">
              <strong>37</strong>
              <p>Delivery throughput is up 9% compared with the previous week.</p>
            </card-content>
          </article>
        </section>
      </main>
    </div>
</template>
