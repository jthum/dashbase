# Login Box / Minimal

A compact authentication panel with semantic fields, remembered-session toggle, and primary/secondary actions.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { AuthLoginBoxMinimal } from "@dashbase/react/patterns/auth/login-box/minimal";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { AuthLoginBoxMinimal, authLoginBoxMinimalAssets } from "@dashbase/react/patterns/auth/login-box/minimal/manual";
```

## Scope

- Category: `auth`
- Family: `login-box`
- Variant: `minimal`
- Scope: `section`

## Dependencies

- Components: `button`, `card`, `checkbox`, `form-field`, `input`, `label`
- Patterns: none

## Assets

- CSS: `./pattern.css`
- CSS: `dist/components/button/button.css`
- CSS: `dist/components/card/card.css`
- CSS: `dist/components/checkbox/checkbox.css`
- CSS: `dist/components/form-field/form-field.css`
- CSS: `dist/components/input/input.css`
- CSS: `dist/components/label/label.css`

## Usage

```tsx
import { AuthLoginBoxMinimal } from "@dashbase/react/patterns/auth/login-box/minimal";

export function Example() {
  return (
    <AuthLoginBoxMinimal />
  );
}
```

## Adapter Props

- `title?: string` Heading shown at the top of the login panel. Default: "Welcome back".
- `description?: string` Supporting copy shown under the heading. Default: "Sign in to continue managing your Dashbase workspace and recent approvals.".
- `emailLabel?: string` Label for the email field. Default: "Email".
- `emailPlaceholder?: string` Placeholder text for the email field. Default: "you@example.com".
- `passwordLabel?: string` Label for the password field. Default: "Password".
- `passwordPlaceholder?: string` Placeholder text for the password field. Default: "Enter your password".
- `rememberLabel?: string` Copy next to the remember-session checkbox. Default: "Keep me signed in for 30 days".
- `submitLabel?: string` Primary action label. Default: "Sign in".
- `secondaryLabel?: string` Secondary action label. Default: "Forgot password?".

## Slots

- `footerNote?: React.ReactNode` Optional content rendered below the action buttons. No default fallback markup.

## Rendered Structure

```tsx
<article className="card" aria-labelledby="login-box-title">
      <header>
        <div className="meta">
          <h1 id="login-box-title">{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <card-content>
        <form className="login-form">
          <form-field>
            <label className="required" htmlFor="login-email">{emailLabel}</label>
            <input id="login-email" type="email" placeholder={emailPlaceholder} required autoComplete="email" />
          </form-field>

          <form-field>
            <label className="required" htmlFor="login-password">{passwordLabel}</label>
            <input id="login-password" type="password" placeholder={passwordPlaceholder} required autoComplete="current-password" />
          </form-field>

          <div className="inline-group">
            <input type="checkbox" id="remember-session" />
            <label htmlFor="remember-session">{rememberLabel}</label>
          </div>
        </form>
      </card-content>

      <footer>
        <div className="login-actions">
          <button className="primary" type="submit">{submitLabel}</button>
          <button className="ghost" type="button">{secondaryLabel}</button>
          {footerNote}
        </div>
      </footer>
    </article>
```
