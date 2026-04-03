# Form Field / Select With Helper Error

Composes a required label, semantic select, helper copy, and inline error messaging into a reusable field-level pattern.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { FormsFormFieldSelectWithHelperError } from "@dashbase/react/patterns/forms/form-field/select-with-helper-error";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { FormsFormFieldSelectWithHelperError, formsFormFieldSelectWithHelperErrorAssets } from "@dashbase/react/patterns/forms/form-field/select-with-helper-error/manual";
```

## Scope

- Category: `forms`
- Family: `form-field`
- Variant: `select-with-helper-error`
- Scope: `field`

## Dependencies

- Components: `form-field`, `label`, `select`
- Patterns: none

## Assets

- CSS: `./pattern.css`
- CSS: `dist/components/form-field/form-field.css`
- CSS: `dist/components/label/label.css`
- CSS: `dist/components/select/select.css`

## Usage

```tsx
import { FormsFormFieldSelectWithHelperError } from "@dashbase/react/patterns/forms/form-field/select-with-helper-error";

export function Example() {
  return (
    <FormsFormFieldSelectWithHelperError />
  );
}
```

## Adapter Props

- `title?: string` Pattern title shown in the demo surface. Default: "Form Field / Select With Helper Error".
- `description?: string` Supporting copy shown above the field. Default: "Use this when the field needs clear context, required state, helper guidance, and inline validation feedback in a single consistent block.".
- `label?: string` Field label. Default: "State of birth".
- `helper?: string` Helper copy shown below the field. Default: "Select the state in which you were born, not the state in which you currently reside.".
- `error?: string` Inline validation message. Default: "You must select a state before continuing.".

## Rendered Structure

```tsx
<section className="surface" aria-labelledby="birth-state-pattern-title">
      <h1 id="birth-state-pattern-title">{title}</h1>
      <p>{description}</p>

      <form-field>
        <label className="required" htmlFor="birth-state">{label}</label>
        <select id="birth-state" required aria-describedby="birth-state-help birth-state-error">
          <option value="">Choose a state</option>
          <option>Andhra Pradesh</option>
          <option>Karnataka</option>
          <option>Maharashtra</option>
          <option>Tamil Nadu</option>
          <option>Telangana</option>
        </select>
        <small id="birth-state-help">{helper}</small>
        <small id="birth-state-error" className="error">{error}</small>
      </form-field>
    </section>
```
