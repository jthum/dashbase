<script module lang="ts">
  import "./pattern.css";
  import "../../../../../../dist/components/button/button.css";
  import "../../../../../../dist/components/card/card.css";
  import "../../../../../../dist/components/checkbox/checkbox.css";
  import "../../../../../../dist/components/form-field/form-field.css";
  import "../../../../../../dist/components/input/input.css";
  import "../../../../../../dist/components/label/label.css";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface AuthLoginBoxMinimalProps {
    title?: string;
    description?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    rememberLabel?: string;
    submitLabel?: string;
    secondaryLabel?: string;
    footerNote?: Snippet;
  }

  let { title = "Welcome back", description = "Sign in to continue managing your Dashbase workspace and recent approvals.", emailLabel = "Email", emailPlaceholder = "you@example.com", passwordLabel = "Password", passwordPlaceholder = "Enter your password", rememberLabel = "Keep me signed in for 30 days", submitLabel = "Sign in", secondaryLabel = "Forgot password?", footerNote }: AuthLoginBoxMinimalProps = $props();
</script>

<article class="card" aria-labelledby="login-box-title">
      <header>
        <div class="meta">
          <h1 id="login-box-title">{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <card-content>
        <form class="login-form">
          <form-field>
            <label class="required" for="login-email">{emailLabel}</label>
            <input id="login-email" type="email" placeholder={emailPlaceholder} required autocomplete="email" />
          </form-field>

          <form-field>
            <label class="required" for="login-password">{passwordLabel}</label>
            <input id="login-password" type="password" placeholder={passwordPlaceholder} required autocomplete="current-password" />
          </form-field>

          <div class="inline-group">
            <input type="checkbox" id="remember-session" />
            <label for="remember-session">{rememberLabel}</label>
          </div>
        </form>
      </card-content>

      <footer>
        <div class="login-actions">
          <button class="primary" type="submit">{submitLabel}</button>
          <button class="ghost" type="button">{secondaryLabel}</button>
          {@render footerNote?.()}
        </div>
      </footer>
    </article>
