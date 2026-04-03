<script module lang="ts">
  import "./pattern.css";
  import "../../../../../../dist/components/button/button.css";
  import "../../../../../../dist/components/card/card.css";
  import "../../../../../../dist/components/checkbox/checkbox.css";
  import "../../../../../../dist/components/form-field/form-field.css";
  import "../../../../../../dist/components/input/input.css";
  import "../../../../../../dist/components/label/label.css";
</script>

<main class="login-screen">
    <section class="intro-panel" aria-labelledby="login-screen-title">
      <small>Team workspace</small>
      <h1 id="login-screen-title">Move approvals, launches, and follow-up work through one shared operating system.</h1>
      <p>Dashbase keeps requests, evidence, and accountable next steps in the same surface so teams stop losing context between meetings, tickets, and exported decks.</p>
      <ul>
        <li>Review release readiness with live evidence attached</li>
        <li>Share status updates without rebuilding the same report twice</li>
        <li>Keep finance, legal, and operations aligned on the same artifact</li>
      </ul>
    </section>

    <section class="form-panel" aria-label="Sign in">
      <article class="card" aria-labelledby="login-box-title">
            <header>
              <div class="meta">
                <h1 id="login-box-title">Welcome back</h1>
                <p>Sign in to continue managing your Dashbase workspace and recent approvals.</p>
              </div>
            </header>

            <card-content>
              <form class="login-form">
                <form-field>
                  <label class="required" for="login-email">Email</label>
                  <input id="login-email" type="email" placeholder="you@example.com" required autocomplete="email" />
                </form-field>

                <form-field>
                  <label class="required" for="login-password">Password</label>
                  <input id="login-password" type="password" placeholder="Enter your password" required autocomplete="current-password" />
                </form-field>

                <div class="inline-group">
                  <input type="checkbox" id="remember-session" />
                  <label for="remember-session">Keep me signed in for 30 days</label>
                </div>
              </form>
            </card-content>

            <footer>
              <div class="login-actions">
                <button class="primary" type="submit">Sign in</button>
                <button class="ghost" type="button">Forgot password?</button>
                
              </div>
            </footer>
          </article>
    </section>
  </main>
