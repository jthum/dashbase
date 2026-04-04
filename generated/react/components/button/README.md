# Button

Styles native button elements with class-based variants, sizes, and icon treatment without requiring a behavior shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { Button } from "@dashbase/react/button";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { Button, buttonAssets } from "@dashbase/react/button/manual";
```

## Behavior Hosting

- Generated adapter mode: `generated`

## Anatomy

- `Button` renders `<button>`

## Assets

- CSS: `dist/components/button/button.css`
- No behavior shim is required.

## Variants

- `primary` adds `.primary` on `root`
- `danger` adds `.danger` on `root`
- `ghost` adds `.ghost` on `root`
- `outline` adds `.outline` on `root`
- `link` adds `.link` on `root`
- `xs` adds `.xs` on `root`
- `small` adds `.small` on `root`
- `large` adds `.large` on `root`
- `xl` adds `.xl` on `root`
- `icon` adds `.icon` on `root`

## Adapter Props

- `variant` accepts `primary`, `danger`, `ghost`, `outline`, `link` and maps them to classes on `root`
- `size` accepts `xs`, `sm`, `lg`, `xl`, `icon` and maps them to classes on `root`

## State Surface

- `disabled` on `root`