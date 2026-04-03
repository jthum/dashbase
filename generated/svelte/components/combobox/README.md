# Combobox

Builds a searchable combobox from a semantic input plus a popover listbox, with filtering, active option movement, and selection handled by a small shim.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```svelte
<script lang="ts">
  import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/svelte/combobox";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty, comboboxAssets } from "@dashbase/svelte/combobox/manual";
```

## Generated Examples

- `@dashbase/svelte/combobox/examples`

## Usage

### Assignee picker

```svelte
<script lang="ts">
  import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/svelte/combobox";
</script>

<label for="assignee-picker">Assign reviewer</label>
<Combobox>
  <ComboboxInput
    id="assignee-picker"
    type="text"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="false"
    aria-controls="assignee-options"
    autocomplete="off"
    placeholder="Search teammates…"
  />
  <ComboboxPanel id="assignee-options" popover="auto" role="listbox" aria-label="Reviewer options">
    <ComboboxOption type="button" role="option" data-value="ava-malik" data-keywords="design accessibility motion">Ava Malik <span>Design systems</span></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="rina-shah" data-keywords="qa testing release">Rina Shah <span>Quality assurance</span></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="marco-silva" data-keywords="frontend react ui">Marco Silva <span>Frontend</span></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="noah-lee" data-keywords="data analytics warehouse">Noah Lee <span>Data platform</span></ComboboxOption>
    <ComboboxEmpty hidden>No reviewers match that search.</ComboboxEmpty>
  </ComboboxPanel>
</Combobox>
<small data-hint>Try searching by name, team, or specialty.</small>

```

### Library picker

```svelte
<script lang="ts">
  import { Combobox, ComboboxInput, ComboboxPanel, ComboboxOption, ComboboxEmpty } from "@dashbase/svelte/combobox";
</script>

<label for="framework-picker">Reference component library</label>
<Combobox>
  <ComboboxInput
    id="framework-picker"
    type="text"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="false"
    aria-controls="framework-options"
    autocomplete="off"
    placeholder="Search libraries…"
  />
  <ComboboxPanel id="framework-options" popover="auto" role="listbox" aria-label="Component library options">
    <ComboboxOption type="button" role="option" data-value="dashbase" data-keywords="semantic css custom elements">Dashbase <kbd>CSS</kbd></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="shadcn" data-keywords="react radix tailwind ui">Shadcn UI <kbd>React</kbd></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="open-props" data-keywords="tokens primitives theming">Open Props <kbd>Tokens</kbd></ComboboxOption>
    <ComboboxOption type="button" role="option" data-value="mantine" data-keywords="react component library">Mantine <kbd>React</kbd></ComboboxOption>
    <ComboboxEmpty hidden>No libraries match that search.</ComboboxEmpty>
  </ComboboxPanel>
</Combobox>
<small data-hint>Keywords are searchable even when they are not visible in the label.</small>

```
