# Popover Panel

Provides the shared anchored overlay primitive for utility popovers and menus, with panel anatomy, menu mode, and a browser-native popover shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter } from "@dashbase/react/popover";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { PopoverPanel, PopoverHeader, PopoverContent, PopoverFooter, popoverAssets } from "@dashbase/react/popover/manual";
```

## Anatomy

- `PopoverPanel` renders `<popover-panel>`
- `PopoverHeader` renders `<panel-header>`
- `PopoverContent` renders `<panel-content>`
- `PopoverFooter` renders `<panel-footer>`

## Assets

- CSS: `dist/components/panel/panel.css`
- CSS: `dist/components/popover/popover.css`
- JS: `dist/components/popover/popover.js`

## Variants

- `wide` adds `.wide` on `root`
- `alignEnd` adds `.align-end` on `root`
- `above` adds `.above` on `root`
- `submenu` adds `.submenu` on `root`
- `contextMenu` adds `.context-menu` on `root`
- `role` maps to `role` on `root`

## State Surface

- `popover` on `root`
- `aria-checked` on `menu-item` ("true", "false")