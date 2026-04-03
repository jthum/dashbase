# Login Box / Minimal

A compact authentication panel with semantic fields, remembered-session toggle, and primary/secondary actions.

## Imports

```vue
<script setup lang="ts">
import { AuthLoginBoxMinimal } from "@dashbase/vue/patterns/auth/login-box/minimal";
</script>
```

```ts
import { AuthLoginBoxMinimal, authLoginBoxMinimalAssets } from "@dashbase/vue/patterns/auth/login-box/minimal/manual";
```

## Scope

- Category: `auth`
- Family: `login-box`
- Variant: `minimal`
- Scope: `section`

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

## Named Slots

- `footerNote` Optional content rendered below the action buttons. No fallback markup.

Use Vue named slots to supply those regions.

## Usage

```vue
<script setup lang="ts">
  import { AuthLoginBoxMinimal } from "@dashbase/vue/patterns/auth/login-box/minimal";
</script>

<template>
<AuthLoginBoxMinimal />
</template>
```
