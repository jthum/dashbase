# Combobox

Builds a searchable combobox from a semantic input plus a popover listbox, with filtering, active option movement, and selection handled by a small shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/react/combobox";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty, comboboxAssets } from "@dashbase/react/combobox/manual";
```

## Behavior Hosting

- Generated adapter mode: `browser-shim`
- The default entrypoint auto-imports a browser behavior shim.
- In SSR frameworks, mount this component from a client boundary or after client hydration.
- The shim mutates live DOM state. If a framework starts fighting those mutations, prefer a controller-backed or native override.
- If React state starts competing with aria-expanded or aria-activedescendant, prefer a controller-backed override before deepening the browser-shim wrapper.

## Anatomy

- `Combobox` renders `<combo-box>`
- `ComboboxInput` renders `<input>`
- `ComboboxPanel` renders `<popover-panel>`
- `ComboboxOption` renders `<button>`
- `ComboboxEmpty` renders `<combobox-empty>`

## Assets

- CSS: `dist/components/input/input.css`
- CSS: `dist/components/popover/popover.css`
- CSS: `dist/components/combobox/combobox.css`
- JS: `dist/components/combobox/combobox.js`

## State Surface

- `aria-expanded` on `input` ("true", "false")
- `aria-activedescendant` on `input`
- `aria-selected` on `option` ("true")
- `hidden` on `option`

## Accessibility

- Focus model: `active-descendant`
- Required authored attributes on `input`: `aria-autocomplete`, `aria-expanded`, `aria-controls`
- Required authored attributes on `panel`: `id`
- Relationship: `input` uses `aria-controls` to reference `panel`
- Relationship: `input` uses `aria-activedescendant` to reference `option`
- Keyboard: `ArrowDown` on `input` opens the list and moves the active option forward.
- Keyboard: `ArrowUp` on `input` opens the list and moves the active option backward.
- Keyboard: `Enter` on `input` commits the active option as the current value.
- Keyboard: `Escape` on `input` dismisses the listbox without selecting another option.

## Examples

### Assignee picker

```tsx
import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/react/combobox";

export function AssigneeComboboxExample() {
  return (
    <>
      <label htmlFor="assignee-picker">Assign reviewer</label>
                  <Combobox>
                    <input
                      id="assignee-picker"
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded="false"
                      aria-controls="assignee-options"
                      autoComplete="off"
                      placeholder="Search teammates…"
                    />
                    <ComboboxPanel id="assignee-options" popover="auto" role="listbox" aria-label="Reviewer options">
                      <button type="button" role="option" data-value="ava-malik" data-keywords="design accessibility motion">Ava Malik <span>Design systems</span></button>
                      <button type="button" role="option" data-value="rina-shah" data-keywords="qa testing release">Rina Shah <span>Quality assurance</span></button>
                      <button type="button" role="option" data-value="marco-silva" data-keywords="frontend react ui">Marco Silva <span>Frontend</span></button>
                      <button type="button" role="option" data-value="noah-lee" data-keywords="data analytics warehouse">Noah Lee <span>Data platform</span></button>
                      <ComboboxEmpty hidden>No reviewers match that search.</ComboboxEmpty>
                    </ComboboxPanel>
                  </Combobox>
                  <small data-hint>Try searching by name, team, or specialty.</small>
    </>
  );
}
```

### Library picker

```tsx
import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/react/combobox";

export function FrameworkComboboxExample() {
  return (
    <>
      <label htmlFor="framework-picker">Reference component library</label>
                  <Combobox>
                    <input
                      id="framework-picker"
                      type="text"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded="false"
                      aria-controls="framework-options"
                      autoComplete="off"
                      placeholder="Search libraries…"
                    />
                    <ComboboxPanel id="framework-options" popover="auto" role="listbox" aria-label="Component library options">
                      <button type="button" role="option" data-value="dashbase" data-keywords="semantic css custom elements">Dashbase <kbd>CSS</kbd></button>
                      <button type="button" role="option" data-value="shadcn" data-keywords="react radix tailwind ui">Shadcn UI <kbd>React</kbd></button>
                      <button type="button" role="option" data-value="open-props" data-keywords="tokens primitives theming">Open Props <kbd>Tokens</kbd></button>
                      <button type="button" role="option" data-value="mantine" data-keywords="react component library">Mantine <kbd>React</kbd></button>
                      <ComboboxEmpty hidden>No libraries match that search.</ComboboxEmpty>
                    </ComboboxPanel>
                  </Combobox>
                  <small data-hint>Keywords are searchable even when they are not visible in the label.</small>
    </>
  );
}
```
