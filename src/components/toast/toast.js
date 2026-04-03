/*
 * Dashbase — Toast behavior
 *
 * Enhances <toast-region> and <ui-toast> with:
 * - programmatic toast creation via window.DashbaseToast.show()
 * - declarative triggers via data-toast-target / data-toast-* attributes
 * - auto-dismiss with pause on hover / focus
 * - dismiss buttons via [data-toast-dismiss]
 */

const TOAST_REGION_SELECTOR = "toast-region";
const TOAST_SELECTOR = "ui-toast";
const CLOSE_ANIMATION_MS = 180;
const DEFAULT_DURATION = 5000;

const toastTimers = new WeakMap();

function isToastRegion(value) {
  return value instanceof HTMLElement && value.matches(TOAST_REGION_SELECTOR);
}

function isToast(value) {
  return value instanceof HTMLElement && value.matches(TOAST_SELECTOR);
}

function ensureRegion(value) {
  if (isToastRegion(value)) {
    return value;
  }

  const region = typeof value === "string" ? document.getElementById(value) : null;
  return isToastRegion(region) ? region : null;
}

function ensureToastAccessibility(toast) {
  if (!toast.hasAttribute("role")) {
    toast.setAttribute("role", toast.classList.contains("danger") ? "alert" : "status");
  }

  if (!toast.hasAttribute("aria-live")) {
    toast.setAttribute("aria-live", toast.getAttribute("role") === "alert" ? "assertive" : "polite");
  }

  if (!toast.hasAttribute("aria-atomic")) {
    toast.setAttribute("aria-atomic", "true");
  }
}

function clearToastTimer(toast) {
  const state = toastTimers.get(toast);
  if (!state) {
    return;
  }

  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
  }

  toastTimers.delete(toast);
}

function dismissToast(toast) {
  if (!isToast(toast) || toast.getAttribute("data-state") === "closing") {
    return;
  }

  clearToastTimer(toast);
  toast.setAttribute("data-state", "closing");

  window.setTimeout(() => {
    toast.remove();
  }, CLOSE_ANIMATION_MS);
}

function scheduleAutoDismiss(toast, duration) {
  const timeout = Number(duration);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    return;
  }

  const state = {
    duration: timeout,
    remaining: timeout,
    timeoutId: null,
    startedAt: performance.now(),
  };

  function startTimer() {
    state.startedAt = performance.now();
    state.timeoutId = window.setTimeout(() => dismissToast(toast), state.remaining);
  }

  function pauseTimer() {
    if (!state.timeoutId) {
      return;
    }

    clearTimeout(state.timeoutId);
    state.timeoutId = null;
    state.remaining -= performance.now() - state.startedAt;
  }

  function resumeTimer() {
    if (state.timeoutId || state.remaining <= 0) {
      return;
    }

    startTimer();
  }

  toast.addEventListener("pointerenter", pauseTimer);
  toast.addEventListener("pointerleave", resumeTimer);
  toast.addEventListener("focusin", pauseTimer);
  toast.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Node && toast.contains(event.relatedTarget)) {
      return;
    }
    resumeTimer();
  });

  startTimer();
  toastTimers.set(toast, state);
}

function initializeToast(toast) {
  ensureToastAccessibility(toast);
  if (!toast.hasAttribute("data-state")) {
    toast.setAttribute("data-state", "open");
  }

  const duration = toast.getAttribute("data-duration") ?? DEFAULT_DURATION;
  scheduleAutoDismiss(toast, duration);
}

function createActionButton({ label, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", (event) => {
    onClick?.(event);
  });
  return button;
}

function createDismissButton(label = "Dismiss notification") {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-toast-dismiss", "");
  button.setAttribute("aria-label", label);
  button.textContent = "×";
  return button;
}

function showToast(options = {}) {
  const region = ensureRegion(options.region) ?? ensureRegion(document.querySelector(TOAST_REGION_SELECTOR));
  if (!region) {
    throw new Error("DashbaseToast.show() requires an existing <toast-region>.");
  }

  const toast = document.createElement("ui-toast");
  const variant = options.variant ?? "";
  if (variant) {
    toast.className = variant;
  }

  if (options.duration != null) {
    toast.setAttribute("data-duration", String(options.duration));
  }

  const content = document.createElement("toast-content");

  if (options.title) {
    const title = document.createElement("strong");
    title.textContent = options.title;
    content.append(title);
  }

  if (options.description) {
    const description = document.createElement("p");
    description.textContent = options.description;
    content.append(description);
  }

  toast.append(content);

  const needsActions = options.action?.label || options.dismissible !== false;
  if (needsActions) {
    const actions = document.createElement("toast-actions");

    if (options.action?.label) {
      actions.append(createActionButton(options.action));
    }

    if (options.dismissible !== false) {
      actions.append(createDismissButton());
    }

    toast.append(actions);
  }

  region.prepend(toast);
  initializeToast(toast);
  return toast;
}

for (const toast of document.querySelectorAll(TOAST_SELECTOR)) {
  if (isToast(toast)) {
    initializeToast(toast);
  }
}

document.addEventListener("click", (event) => {
  const dismissButton = event.target instanceof HTMLElement
    ? event.target.closest("[data-toast-dismiss]")
    : null;

  if (dismissButton instanceof HTMLElement) {
    const toast = dismissButton.closest(TOAST_SELECTOR);
    if (isToast(toast)) {
      dismissToast(toast);
    }
    return;
  }

  const trigger = event.target instanceof HTMLElement
    ? event.target.closest("[data-toast-target]")
    : null;

  if (!(trigger instanceof HTMLElement)) {
    return;
  }

  const region = trigger.getAttribute("data-toast-target");
  if (!region) {
    return;
  }

  showToast({
    region,
    title: trigger.getAttribute("data-toast-title") ?? undefined,
    description: trigger.getAttribute("data-toast-description") ?? undefined,
    variant: trigger.getAttribute("data-toast-variant") ?? undefined,
    duration: trigger.getAttribute("data-toast-duration") ?? undefined,
  });
});

window.DashbaseToast = {
  show: showToast,
  dismiss: dismissToast,
  clear(regionLike) {
    const region = ensureRegion(regionLike);
    if (!region) {
      return;
    }

    for (const toast of region.querySelectorAll(TOAST_SELECTOR)) {
      if (isToast(toast)) {
        dismissToast(toast);
      }
    }
  },
};
