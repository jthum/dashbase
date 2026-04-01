# Dashbase Overlay Architecture

Dashbase should treat overlays as one architectural family, not a collection of unrelated widgets.

This document defines the intended model for:

- anchored utility popovers
- action menus
- modal and non-modal dialogs
- shared surface anatomy across overlay-like components

---

## Core Decision

Dashbase uses platform primitives for overlays:

- `<dialog>` for dialog semantics
- `<popover-panel popover>` for non-dialog anchored surfaces
- `<popover-panel popover role="menu">` for action menus

This avoids maintaining separate dropdown and popover implementations while keeping semantics honest.

---

## Surface Types

### 1. Dialogs

Use `<dialog>` whenever the surface is semantically a dialog.

This includes:

- modal confirmations
- settings dialogs
- sheets and drawers that are still dialog-like tasks

Use cases:

- `showModal()` for modal dialogs
- `show()` for non-modal dialogs
- `popover="auto"` on `<dialog>` when a dialog-like surface should light-dismiss

Why:

- native dialog semantics
- built-in `close` behavior
- built-in Escape handling
- built-in modal focus management
- native `::backdrop`

Dashbase should not invent `popover-panel[role="dialog"]` as a replacement for this.

### 2. Utility Popovers

Use `<popover-panel popover>` for anchored, non-dialog utility surfaces.

Examples:

- filters
- account summaries
- shortcut help
- mini forms
- contextual tools

These surfaces are not menus unless they actually expose menu semantics.

### 3. Menus

Use `<popover-panel popover role="menu">` for action menus.

Examples:

- user menus
- action lists
- overflow menus

Menu semantics belong on the panel only when the content truly behaves like a menu.

The menu pattern should add a small behavior layer for:

- roving focus
- Arrow key navigation
- Home / End
- Escape
- optional submenu behavior
- checkbox / radio item state support
- trigger `aria-expanded` sync

---

## Shared Surface Anatomy

Dashbase should use shared anatomy elements across surface components:

- `<panel-header>`
- `<panel-content>`
- `<panel-footer>`

These elements are reusable substructure, not popover-only concepts.

They should style consistently inside:

- `<popover-panel>`
- `<dialog>`
- future drawer/sheet surfaces

This keeps anatomy reusable while letting the outer primitive decide semantics and behavior.

Example:

```html
<popover-panel id="account-panel" popover="auto">
  <panel-header>
    <h2>Account</h2>
    <p>Signed in as john@example.com</p>
  </panel-header>
  <panel-content>
    <p>Workspace tools and quick actions live here.</p>
  </panel-content>
  <panel-footer>
    <button class="ghost">Close</button>
    <button class="danger">Log out</button>
  </panel-footer>
</popover-panel>
```

And for a dialog:

```html
<dialog id="confirm-delete">
  <panel-header>
    <h2>Delete workspace?</h2>
  </panel-header>
  <panel-content>
    <p>This action cannot be undone.</p>
  </panel-content>
  <panel-footer>
    <button class="ghost">Cancel</button>
    <button class="danger">Delete</button>
  </panel-footer>
</dialog>
```

---

## Trigger Rules

When a trigger uses `popovertarget`, it may also expose accessibility state.

Rules:

- `aria-haspopup="menu"` is correct when opening a true menu
- `aria-expanded` must only be present if it is kept in sync with real open/close state
- a static `aria-expanded="false"` that never updates is worse than omitting it

If Dashbase exposes `aria-expanded`, it must provide a tiny sync shim using popover `toggle` events.

---

## What Dashbase Should Avoid

### Avoid two parallel overlay systems

Do not keep:

- one implementation for `popover`
- another separate implementation for `dropdown`

The anchored surface mechanism should be shared.

### Avoid forcing menu semantics onto rich content

Not every anchored panel is a menu.

This is wrong:

```html
<popover-panel popover role="menu">
  <input>
  <textarea>
  <button>Apply</button>
</popover-panel>
```

If the content is a mini form or utility panel, leave it role-less unless a specific semantic role is needed.

### Avoid replacing dialogs with custom panel roles

If the surface is truly a dialog, use `<dialog>`.

---

## Relationship to Existing Dashbase Components

This architecture implies the following long-term direction:

- `popover.css` becomes the base `popover-panel` primitive
- `dropdown.css` should no longer be the long-term primary overlay path
- menu behavior should be rebuilt on `popover-panel[role="menu"]`
- `dialog.css` remains native-dialog-first and shares anatomy with popovers
- drawer and alert-dialog stay dialog variants, not separate primitives

Because Dashbase is pre-1.0, removing earlier overlay concepts is preferable to carrying architectural baggage forward.

---

## Authoring Guidance Summary

When building new overlay-like components:

1. Ask whether the surface is semantically a dialog
2. If yes, use `<dialog>`
3. If no, ask whether it is a generic anchored surface or a menu
4. Use `<popover-panel popover>` for generic anchored content
5. Use `<popover-panel popover role="menu">` for menus
6. Reuse `panel-header`, `panel-content`, and `panel-footer` where anatomy is needed

This is the overlay model future Dashbase work should follow.
