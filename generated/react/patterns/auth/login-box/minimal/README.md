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

## Rendered Structure

```tsx
<article className="card" aria-labelledby="login-box-title">
      <header>
        <div className="meta">
          <h1 id="login-box-title">Welcome back</h1>
          <p>Sign in to continue managing your Dashbase workspace and recent approvals.</p>
        </div>
      </header>

      <card-content>
        <form className="login-form">
          <form-field>
            <label className="required" htmlFor="login-email">Email</label>
            <input id="login-email" type="email" placeholder="you@example.com" required autoComplete="email" />
          </form-field>

          <form-field>
            <label className="required" htmlFor="login-password">Password</label>
            <input id="login-password" type="password" placeholder="Enter your password" required autoComplete="current-password" />
          </form-field>

          <div className="inline-group">
            <input type="checkbox" id="remember-session" />
            <label htmlFor="remember-session">Keep me signed in for 30 days</label>
          </div>
        </form>
      </card-content>

      <footer>
        <div className="login-actions">
          <button className="primary" type="submit">Sign in</button>
          <button className="ghost" type="button">Forgot password?</button>
        </div>
      </footer>
    </article>
```
