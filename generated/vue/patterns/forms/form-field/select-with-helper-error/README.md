# Form Field / Select With Helper Error

Composes a required label, semantic select, helper copy, and inline error messaging into a reusable field-level pattern.

## Imports

```vue
<script setup lang="ts">
import { FormsFormFieldSelectWithHelperError } from "@dashbase/vue/patterns/forms/form-field/select-with-helper-error";
</script>
```

```ts
import { FormsFormFieldSelectWithHelperError, formsFormFieldSelectWithHelperErrorAssets } from "@dashbase/vue/patterns/forms/form-field/select-with-helper-error/manual";
```

## Scope

- Category: `forms`
- Family: `form-field`
- Variant: `select-with-helper-error`
- Scope: `field`

## Adapter Props

- `title?: string` Pattern title shown in the demo surface. Default: "Form Field / Select With Helper Error".
- `description?: string` Supporting copy shown above the field. Default: "Use this when the field needs clear context, required state, helper guidance, and inline validation feedback in a single consistent block.".
- `label?: string` Field label. Default: "State of birth".
- `helper?: string` Helper copy shown below the field. Default: "Select the state in which you were born, not the state in which you currently reside.".
- `error?: string` Inline validation message. Default: "You must select a state before continuing.".

## Usage

```vue
<script setup lang="ts">
  import { FormsFormFieldSelectWithHelperError } from "@dashbase/vue/patterns/forms/form-field/select-with-helper-error";
</script>

<template>
<FormsFormFieldSelectWithHelperError />
</template>
```
