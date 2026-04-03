<script module lang="ts">
  import "./pattern.css";
  import "../../../../../../dist/components/form-field/form-field.css";
  import "../../../../../../dist/components/label/label.css";
  import "../../../../../../dist/components/select/select.css";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface FormsFormFieldSelectWithHelperErrorProps {
    title?: string;
    description?: string;
    label?: string;
    helper?: string;
    error?: string;
  }

  let { title = "Form Field / Select With Helper Error", description = "Use this when the field needs clear context, required state, helper guidance, and inline validation feedback in a single consistent block.", label = "State of birth", helper = "Select the state in which you were born, not the state in which you currently reside.", error = "You must select a state before continuing." }: FormsFormFieldSelectWithHelperErrorProps = $props();
</script>

<section class="surface" aria-labelledby="birth-state-pattern-title">
      <h1 id="birth-state-pattern-title">{title}</h1>
      <p>{description}</p>

      <form-field>
        <label class="required" for="birth-state">{label}</label>
        <select id="birth-state" required aria-describedby="birth-state-help birth-state-error">
          <option value="">Choose a state</option>
          <option>Andhra Pradesh</option>
          <option>Karnataka</option>
          <option>Maharashtra</option>
          <option>Tamil Nadu</option>
          <option>Telangana</option>
        </select>
        <small id="birth-state-help">{helper}</small>
        <small id="birth-state-error" class="error">{error}</small>
      </form-field>
    </section>
