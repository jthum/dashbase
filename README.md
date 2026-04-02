# Dashbase

> A semantic-first CSS component library for web applications. Restoring the original architecture of the web: HTML for structure, CSS for presentation, and JS for behavior.

---

## 🏗️ Philosophy

Modern frontend development has often led to unreadable HTML "class soup." **Dashbase** is built on the belief that the modern web platform is powerful enough to handle styling and structure without heavy utility layers or complex JavaScript frameworks.

- **Semantic First**: Style HTML elements directly (`<button>`, `<input>`, `<dialog>`).
- **Native Power**: Embrace browser defaults and accessibility behaviors.
- **Readable Markup**: Use named custom elements (e.g., `<form-field>`, `<input-group>`) where no semantic HTML equivalent exists.
- **Graceful Degradation**: Design for functional consistency across browsers, not pixel perfection.

---

## ✨ Key Features

- **Pure CSS**: All styling is authored as vanilla CSS using modern features like `@layer` and CSS custom properties.
- **Zero Runtime Dependencies**: No JavaScript or framework required for core styling.
- **Themeable**: Powered by **Baseline CSS**, a robust token and primitive layer.
- **Modular**: Import only what you need. `base.css` + specific component files.
- **Modern CSS**: Uses `@layer`, `:has()`, `oklch()`, `color-mix()`, and native nesting.

---

## 🎨 Architecture: The Cascade Stack

Dashbase uses a layered architecture to ensure style consistency and easy overrides without specificity conflicts.

1.  **Browser Defaults**: The foundational layer (load-bearing).
2.  **Reset**: Minimal normalization (primarily `box-sizing: border-box`).
3.  **Tokens**: Design vocabulary (colors, spacing, typography) defined in **Baseline CSS**.
4.  **Primitives**: Reusable structural patterns sits between tokens and components.
5.  **Base**: Minimal global element defaults (e.g., body typography).
6.  **Components**: Semantic component styling (the heart of Dashbase).
7.  **Utilities**: Highest-level overrides for app-specific needs.

---

## 📂 Project Structure

- **`/src/baseline`**: The foundational design system (reset, tokens, primitives, base).
- **`/src/components`**: Semantic component styles.
- **`/themes`**: Token overrides for alternate visual systems.
- **`/scripts`**: Build tooling.
- **`/dist`**: Generated output after running the build.
- **`/docs`**: Comprehensive documentation, implementation guidance, and PRDs.

---

## 🚀 Getting Started

Build the distributable CSS first:

```bash
bun run build
```

This generates:

- `dist/baseline.css` for the reset/tokens/primitives/base layers
- `dist/components/*.css` for modular component imports
- `dist/behaviors/*.js` for optional progressive-enhancement shims
- `dist/dashbase.css` for the full bundle

The generated CSS stays readable on purpose. Dashbase ships formatted source with comments intact, and the build reports both raw and gzip sizes so transfer cost stays visible without sacrificing view-source friendliness.

To use Dashbase in your project, include the base stylesheet followed by the components you need.

```html
<!-- Load the foundational design system -->
<link rel="stylesheet" href="dist/baseline.css">

<!-- Load only the components you need -->
<link rel="stylesheet" href="dist/components/button.css">
<link rel="stylesheet" href="dist/components/checkbox.css">
<link rel="stylesheet" href="dist/components/input.css">
<link rel="stylesheet" href="dist/components/form-field.css">
<link rel="stylesheet" href="dist/components/panel.css">
<link rel="stylesheet" href="dist/components/accordion.css">
<link rel="stylesheet" href="dist/components/calendar.css">
<link rel="stylesheet" href="dist/components/carousel.css">
<link rel="stylesheet" href="dist/components/card.css">
<link rel="stylesheet" href="dist/components/tabs.css">
<link rel="stylesheet" href="dist/components/popover.css">
<link rel="stylesheet" href="dist/components/dialog.css">
<link rel="stylesheet" href="dist/components/combobox.css">
<link rel="stylesheet" href="dist/components/command.css">
<link rel="stylesheet" href="dist/components/date-picker.css">
<link rel="stylesheet" href="dist/components/data-table.css">
<link rel="stylesheet" href="dist/components/menubar.css">
<link rel="stylesheet" href="dist/components/navigation-menu.css">
<link rel="stylesheet" href="dist/components/scroll-area.css">
<link rel="stylesheet" href="dist/components/resizable.css">
<link rel="stylesheet" href="dist/components/table.css">
<link rel="stylesheet" href="dist/components/toast.css">

<!-- Load only the behavior shims you use -->
<script src="dist/behaviors/calendar.js"></script>
<script src="dist/behaviors/carousel.js"></script>
<script src="dist/behaviors/combobox.js"></script>
<script src="dist/behaviors/dialog.js"></script>
<script src="dist/behaviors/command.js"></script>
<script src="dist/behaviors/date-picker.js"></script>
<script src="dist/behaviors/data-table.js"></script>
<script src="dist/behaviors/menubar.js"></script>
<script src="dist/behaviors/navigation-menu.js"></script>
<script src="dist/behaviors/popover.js"></script>
<script src="dist/behaviors/resizable.js"></script>
<script src="dist/behaviors/tabs.js"></script>
<script src="dist/behaviors/toast.js"></script>
```

### Example Usage

```html
<form-field>
  <label for="email">Email Address</label>
  <input type="email" id="email" placeholder="you@example.com">
  <small data-hint>We'll never share your email.</small>
</form-field>

<button class="primary">Sign Up</button>
```

```html
<article class="card">
  <header>
    <h2>Weekly Report</h2>
    <p>Activation rose 12% week-over-week.</p>
  </header>

  <card-content>
    <p>Review the latest product and growth metrics in one place.</p>
  </card-content>

  <footer>
    <button class="primary">Open report</button>
    <button class="ghost">Share</button>
  </footer>
</article>
```

```html
<details>
  <summary>Deployment checklist</summary>
  <accordion-panel>
    <p>Review the final release checks before shipping.</p>
    <ul>
      <li>Validate examples and docs</li>
      <li>Check light and dark mode</li>
      <li>Verify keyboard and focus behavior</li>
    </ul>
  </accordion-panel>
</details>
```

```html
<ui-tabs>
  <tab-list role="tablist" aria-label="Workspace sections">
    <button type="button" role="tab" id="tab-account" aria-controls="panel-account" aria-selected="true">
      Account
    </button>
    <button type="button" role="tab" id="tab-billing" aria-controls="panel-billing" aria-selected="false">
      Billing
    </button>
  </tab-list>

  <tab-panel id="panel-account" role="tabpanel" aria-labelledby="tab-account">
    <p>Manage profile settings and notification preferences.</p>
  </tab-panel>

  <tab-panel id="panel-billing" role="tabpanel" aria-labelledby="tab-billing" hidden>
    <p>Review invoices, seats, and payment methods.</p>
  </tab-panel>
</ui-tabs>

<script src="dist/behaviors/tabs.js"></script>
```

```html
<calendar-view
  aria-label="Release calendar"
  data-month="2026-04"
  data-selected="2026-04-18"
  data-week-start="1"
  data-time
  data-time-value="09:30"
></calendar-view>

<script src="dist/behaviors/calendar.js"></script>
```

For range selection, switch to `data-mode="range"` and use `data-range-start` / `data-range-end` instead of `data-selected`. Month and year selectors are built into the rendered header.

```html
<date-picker>
  <input type="text" placeholder="Select launch date" readonly />
  <button type="button" aria-label="Open launch date picker">
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.75V3.25M12 1.75V3.25M2 5.25H14M3.25 2.75H12.75C13.3023 2.75 13.75 3.19772 13.75 3.75V13C13.75 13.5523 13.3023 14 12.75 14H3.25C2.69772 14 2.25 13.5523 2.25 13V3.75C2.25 3.19772 2.69772 2.75 3.25 2.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  <popover-panel popover="auto" aria-label="Launch date picker">
    <calendar-view
      aria-label="Launch date"
      data-month="2026-04"
      data-selected="2026-04-18"
      data-time
      data-time-value="09:30"
    ></calendar-view>

    <panel-footer>
      <button type="button" data-date-picker-clear>Clear</button>
      <button type="button" data-date-picker-close>Done</button>
    </panel-footer>
  </popover-panel>
</date-picker>

<script src="dist/behaviors/calendar.js"></script>
<script src="dist/behaviors/date-picker.js"></script>
```

```html
<data-table>
  <table-toolbar>
    <input type="search" data-table-filter placeholder="Filter teammates" aria-label="Filter teammates" />
    <small data-table-result-count aria-live="polite">0 visible of 0</small>
  </table-toolbar>

  <scroll-area class="bare">
    <table class="compact striped interactive">
      <thead>
        <tr>
          <th scope="col">
            <input type="checkbox" data-table-select-all aria-label="Select all visible teammates" />
          </th>
          <th scope="col"><button type="button" data-table-sort data-sort-type="text">Teammate</button></th>
          <th scope="col"><button type="button" data-table-sort data-sort-type="number">MRR</button></th>
        </tr>
      </thead>
      <tbody>
        <tr data-search="maya chen founding designer active">
          <td><input type="checkbox" data-table-row-select aria-label="Select Maya Chen" /></td>
          <th scope="row" data-sort-value="Maya Chen">Maya Chen</th>
          <td data-sort-value="4200">$4,200</td>
        </tr>
        <tr data-search="omar haddad growth lead pilot">
          <td><input type="checkbox" data-table-row-select aria-label="Select Omar Haddad" /></td>
          <th scope="row" data-sort-value="Omar Haddad">Omar Haddad</th>
          <td data-sort-value="3100">$3,100</td>
        </tr>
      </tbody>
    </table>
  </scroll-area>

  <table-meta>
    <small data-table-selection-count aria-live="polite">0 selected</small>
  </table-meta>

  <table-empty hidden>No teammates match that filter.</table-empty>
</data-table>

<script src="dist/behaviors/data-table.js"></script>
```

```html
<carousel aria-label="Launch feature tour">
  <carousel-track>
    <carousel-slide>
      <article>Track signups and activation in the same view.</article>
    </carousel-slide>
    <carousel-slide>
      <article>Compare campaign cohorts without losing the narrative.</article>
    </carousel-slide>
  </carousel-track>

  <carousel-controls>
    <button type="button" data-carousel-prev aria-label="Previous slide">Previous</button>
    <carousel-dots aria-label="Feature tour slides"></carousel-dots>
    <button type="button" data-carousel-next aria-label="Next slide">Next</button>
  </carousel-controls>
</carousel>

<script src="dist/behaviors/carousel.js"></script>
```

```html
<button type="button" invoketarget="workspace-command" invokeaction="showModal">
  Open command palette
</button>

<dialog id="workspace-command" data-command-shortcut="mod+k" aria-label="Command palette">
  <command-search>
    <input type="search" placeholder="Search pages, actions, and settings…" />
  </command-search>

  <command-list>
    <command-group>
      <small>Pages</small>
      <a href="/reports">Reports <kbd>G R</kbd></a>
      <a href="/settings">Settings <kbd>G S</kbd></a>
    </command-group>

    <command-group>
      <small>Actions</small>
      <button type="button">Invite teammate <kbd>I</kbd></button>
      <button type="button">New release draft <kbd>R</kbd></button>
    </command-group>

    <command-empty hidden>No commands match that search.</command-empty>
  </command-list>
</dialog>

<script src="dist/behaviors/dialog.js"></script>
<script src="dist/behaviors/command.js"></script>
```

```html
<form-field>
  <label for="reviewer">Assign reviewer</label>

  <combo-box>
    <input
      id="reviewer"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="false"
      aria-controls="reviewer-options"
      autocomplete="off"
      placeholder="Search teammates…"
    />

    <popover-panel id="reviewer-options" popover="auto" role="listbox" aria-label="Reviewer options">
      <button type="button" role="option" data-value="ava-malik">Ava Malik <span>Design systems</span></button>
      <button type="button" role="option" data-value="rina-shah">Rina Shah <span>Quality assurance</span></button>
      <button type="button" role="option" data-value="marco-silva">Marco Silva <span>Frontend</span></button>
      <combobox-empty hidden>No reviewers match that search.</combobox-empty>
    </popover-panel>
  </combo-box>
</form-field>

<script src="dist/behaviors/combobox.js"></script>
```

```html
<button popovertarget="project-menu" aria-haspopup="menu" aria-expanded="false">
  Project actions
</button>

<popover-panel id="project-menu" popover="auto" role="menu" aria-label="Project actions">
  <panel-header aria-hidden="true">
    <small>Workspace</small>
  </panel-header>
  <button type="button" role="menuitem">Profile <kbd>P</kbd></button>
  <button type="button" role="menuitem">Billing <kbd>B</kbd></button>
  <button type="button" role="menuitem" popovertarget="theme-menu" aria-haspopup="menu">
    Theme
  </button>
  <popover-panel id="theme-menu" popover="auto" role="menu" class="submenu" aria-label="Theme">
    <button type="button" role="menuitemradio" name="theme" aria-checked="true">System</button>
    <button type="button" role="menuitemradio" name="theme" aria-checked="false">Light</button>
  </popover-panel>
  <hr>
  <button type="button" role="menuitem" class="danger">Delete workspace</button>
</popover-panel>

<script src="dist/behaviors/popover.js"></script>
```

Menus and utility popovers share the same `popover-panel` primitive. Add `role="menu"` only when the content truly behaves like a menu.

```html
<menu-bar role="menubar" aria-label="Application menu">
  <button type="button" role="menuitem" popovertarget="file-menu" aria-haspopup="menu" aria-expanded="false">
    File
  </button>

  <popover-panel id="file-menu" popover="auto" role="menu" aria-label="File">
    <panel-header aria-hidden="true">
      <small>File</small>
    </panel-header>
    <button type="button" role="menuitem">New tab</button>
    <button type="button" role="menuitem">Open workspace…</button>
    <button type="button" role="menuitem" popovertarget="export-menu" aria-haspopup="menu">
      Export
    </button>
    <popover-panel id="export-menu" popover="auto" role="menu" class="submenu" aria-label="Export">
      <button type="button" role="menuitem">PNG</button>
      <button type="button" role="menuitem">PDF</button>
    </popover-panel>
  </popover-panel>

  <button type="button" role="menuitem" popovertarget="view-menu" aria-haspopup="menu" aria-expanded="false">
    View
  </button>

  <popover-panel id="view-menu" popover="auto" role="menu" aria-label="View">
    <button type="button" role="menuitemcheckbox" aria-checked="true">Left sidebar</button>
    <button type="button" role="menuitemcheckbox" aria-checked="false">Command palette hint</button>
  </popover-panel>
</menu-bar>

<script src="dist/behaviors/popover.js"></script>
<script src="dist/behaviors/menubar.js"></script>
```

```html
<nav aria-label="Primary">
  <a href="#">Overview</a>

  <button type="button" popovertarget="products-panel" aria-expanded="false">
    Products
  </button>

  <popover-panel id="products-panel" popover="auto">
    <panel-header>
      <h3>Explore the platform</h3>
      <p>Use richer content when the panel is navigation, not a strict menu.</p>
    </panel-header>

    <panel-content>
      <a href="#">Analytics</a>
      <a href="#">Collaboration</a>
      <a href="#">Automation</a>
    </panel-content>
  </popover-panel>

  <a href="#">Pricing</a>
</nav>

<script src="dist/behaviors/popover.js"></script>
<script src="dist/behaviors/navigation-menu.js"></script>
```

```html
<scroll-area style="block-size: 18rem;">
  <scroll-content>
    <article>
      <strong>Release candidate approved</strong>
      <p>Rina signed off on the final QA checklist.</p>
    </article>

    <article>
      <strong>Navigation experiment published</strong>
      <p>The new product navigation panel is now available on staging.</p>
    </article>
  </scroll-content>
</scroll-area>
```

```html
<resizable-group class="horizontal">
  <resizable-pane style="--pane-size: 28%;">
    <h3>Project files</h3>
  </resizable-pane>

  <resizable-handle aria-label="Resize file list and canvas"></resizable-handle>

  <resizable-pane>
    <h3>Canvas preview</h3>
  </resizable-pane>
</resizable-group>

<script src="dist/behaviors/resizable.js"></script>
```

Vertical groups resize along the block axis, so they need a definite block size such as `style="block-size: 32rem;"` or a parent layout that already constrains height.

```html
<toast-region id="notifications" class="top-right grouped" aria-label="Notifications"></toast-region>

<script>
  window.DashbaseToast.show({
    region: "notifications",
    title: "Changes published",
    description: "Workspace settings were updated successfully.",
    variant: "success",
  });
</script>
```

Use `.grouped` on the region when you want the stacked-on-hover presentation; omit it for the simpler always-expanded list.

---

## 🌐 Browser Support

Dashbase targets modern evergreen browsers and uses the platform directly rather than transpiling modern CSS away.

- **Functional first**: semantic HTML remains the foundation. If a browser misses part of the styling surface, the markup should still behave like normal native HTML.
- **Modern CSS baseline**: Dashbase relies on CSS custom properties, `@layer`, logical properties, `color-mix()`, `oklch()`, `light-dark()`, and native nesting.
- **Enhanced states where available**: `:has()` powers parent-aware styling such as `<form-field>` reacting to invalid controls, `:user-invalid` delays error styling until user interaction, and `field-sizing: content` enables textarea auto-growth without JS.
- **Graceful degradation over polyfills**: when a feature is unsupported, Dashbase prefers losing polish over breaking behavior. The browser should fall back to simpler native presentation rather than requiring a heavy compatibility layer.
- **Project-specific compatibility**: if your product has stricter browser requirements, test the specific components you use and add targeted fallbacks in your app layer.

---

## 🛠️ Development & Principles

Dashbase components are authored with a focus on simplicity and platform compatibility.

- **Style the Element**: Prefer `button { }` over `.button { }`.
- **Semantic State Hooks**: Prefer native state selectors like `[disabled]`, `:checked`, `:user-invalid`, and use ARIA attributes when HTML has no native equivalent.
- **Escape Hatches via Variables**: Prefer inline custom properties like `style="--btn-bg: ..."` over one-off variants or `!important`.
- **Use `@scope` Sparingly**: Respect the cascade first. Reach for `@scope` only in composite components that truly need descendant containment.
- **No `!important`**: If you need it, the layer architecture is likely being bypassed.
- **Logical Properties**: Use `padding-inline`, `margin-block`, etc., for RTL-ready layouts.

---

## 📄 License

This project is released under the [MIT License](LICENSE).
