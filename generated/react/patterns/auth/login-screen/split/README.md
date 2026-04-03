# Login Screen / Split

A page-level authentication shell that pairs contextual onboarding copy with the canonical login-box panel on larger viewports.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { AuthLoginScreenSplit } from "@dashbase/react/patterns/auth/login-screen/split";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { AuthLoginScreenSplit, authLoginScreenSplitAssets } from "@dashbase/react/patterns/auth/login-screen/split/manual";
```

## Scope

- Category: `auth`
- Family: `login-screen`
- Variant: `split`
- Scope: `page`

## Dependencies

- Components: none
- Patterns: `auth/login-box/minimal`

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
import { AuthLoginScreenSplit } from "@dashbase/react/patterns/auth/login-screen/split";

export function Example() {
  return (
    <AuthLoginScreenSplit />
  );
}
```

## Rendered Structure

```tsx
<main className="login-screen">
    <section className="intro-panel" aria-labelledby="login-screen-title">
      <small>Team workspace</small>
      <h1 id="login-screen-title">Move approvals, launches, and follow-up work through one shared operating system.</h1>
      <p>Dashbase keeps requests, evidence, and accountable next steps in the same surface so teams stop losing context between meetings, tickets, and exported decks.</p>
      <ul>
        <li>Review release readiness with live evidence attached</li>
        <li>Share status updates without rebuilding the same report twice</li>
        <li>Keep finance, legal, and operations aligned on the same artifact</li>
      </ul>
    </section>

    <section className="form-panel" aria-label="Sign in">
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
    </section>
  </main>
```
