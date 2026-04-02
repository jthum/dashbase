/*
 * Dashbase — Hover Card behavior
 *
 * Enhances [data-hovercard] invokers with delayed hover / focus opening for a
 * linked <popover-panel popover class="hover-card"> surface.
 */

const HOVERCARD_ATTR = "data-hovercard";
const HOVERCARD_SELECTOR = `[${HOVERCARD_ATTR}]`;
const HOVERCARD_PANEL_SELECTOR = 'popover-panel[popover].hover-card';
const HOVERCARD_OPEN_DELAY = 120;
const HOVERCARD_CLOSE_DELAY = 100;
const hoverCardState = new WeakMap();
const hoverCardInvokerByPanel = new WeakMap();
let hoverCardPanelCount = 0;

function isHoverCardPanel(value) {
  return value instanceof HTMLElement && value.matches(HOVERCARD_PANEL_SELECTOR);
}

function ensurePanelId(panel) {
  if (panel.id) {
    return panel.id;
  }

  hoverCardPanelCount += 1;
  panel.id = `dashbase-hover-card-${hoverCardPanelCount}`;
  return panel.id;
}

function getHoverCardPanel(invoker) {
  const targetId = invoker.getAttribute(HOVERCARD_ATTR);
  if (!targetId) {
    return null;
  }

  const panel = document.getElementById(targetId);
  return isHoverCardPanel(panel) ? panel : null;
}

function getHoverCardInvoker(panel) {
  const explicitInvoker = hoverCardInvokerByPanel.get(panel);
  if (explicitInvoker instanceof HTMLElement && explicitInvoker.isConnected) {
    return explicitInvoker;
  }

  const id = ensurePanelId(panel);
  const invoker = document.querySelector(`[${HOVERCARD_ATTR}="${CSS.escape(id)}"]`);

  return invoker instanceof HTMLElement ? invoker : null;
}

function getState(invoker) {
  if (!hoverCardState.has(invoker)) {
    hoverCardState.set(invoker, {
      openTimer: null,
      closeTimer: null,
    });
  }

  return hoverCardState.get(invoker);
}

function clearTimer(timerId) {
  if (timerId !== null) {
    window.clearTimeout(timerId);
  }
}

function syncHoverCardState(invoker, panel) {
  invoker.setAttribute("aria-controls", ensurePanelId(panel));

  if (invoker.hasAttribute("aria-expanded")) {
    invoker.setAttribute("aria-expanded", String(panel.matches(":popover-open")));
  }
}

function shouldKeepHoverCardOpen(invoker, panel) {
  const activeElement = document.activeElement;

  return (
    invoker.matches(":hover") ||
    invoker.matches(":focus-visible") ||
    panel.matches(":hover") ||
    panel.contains(activeElement)
  );
}

function closeHoverCard(invoker, { focusInvoker = false } = {}) {
  const panel = getHoverCardPanel(invoker);
  if (!panel) {
    return;
  }

  if (panel.matches(":popover-open")) {
    panel.hidePopover();
  }

  syncHoverCardState(invoker, panel);

  if (focusInvoker) {
    invoker.focus();
  }
}

function closeOtherHoverCards({ except = null } = {}) {
  for (const panel of document.querySelectorAll(`${HOVERCARD_PANEL_SELECTOR}:popover-open`)) {
    if (!isHoverCardPanel(panel) || panel === except) {
      continue;
    }

    const invoker = getHoverCardInvoker(panel);
    if (invoker) {
      closeHoverCard(invoker);
    } else {
      panel.hidePopover();
    }
  }
}

function openHoverCard(invoker) {
  const panel = getHoverCardPanel(invoker);
  if (!panel) {
    return;
  }

  hoverCardInvokerByPanel.set(panel, invoker);
  closeOtherHoverCards({ except: panel });

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }

  syncHoverCardState(invoker, panel);
}

function scheduleOpen(invoker) {
  const panel = getHoverCardPanel(invoker);
  if (!panel) {
    return;
  }

  const state = getState(invoker);
  clearTimer(state.closeTimer);

  state.openTimer = window.setTimeout(() => {
    openHoverCard(invoker);
    state.openTimer = null;
  }, HOVERCARD_OPEN_DELAY);
}

function scheduleClose(invoker) {
  const panel = getHoverCardPanel(invoker);
  if (!panel) {
    return;
  }

  const state = getState(invoker);
  clearTimer(state.openTimer);

  state.closeTimer = window.setTimeout(() => {
    if (!shouldKeepHoverCardOpen(invoker, panel)) {
      closeHoverCard(invoker);
    }
    state.closeTimer = null;
  }, HOVERCARD_CLOSE_DELAY);
}

function initializeHoverCard(invoker) {
  const panel = getHoverCardPanel(invoker);
  if (!panel) {
    return;
  }

  hoverCardInvokerByPanel.set(panel, invoker);
  syncHoverCardState(invoker, panel);

  invoker.addEventListener("pointerenter", () => scheduleOpen(invoker));
  invoker.addEventListener("pointerleave", () => scheduleClose(invoker));
  invoker.addEventListener("focusin", () => scheduleOpen(invoker));
  invoker.addEventListener("focusout", () => scheduleClose(invoker));

  panel.addEventListener("pointerenter", () => {
    const state = getState(invoker);
    clearTimer(state.closeTimer);
  });

  panel.addEventListener("pointerleave", () => scheduleClose(invoker));
  panel.addEventListener("focusin", () => {
    const state = getState(invoker);
    clearTimer(state.closeTimer);
  });
  panel.addEventListener("focusout", () => scheduleClose(invoker));
}

for (const invoker of document.querySelectorAll(HOVERCARD_SELECTOR)) {
  if (invoker instanceof HTMLElement) {
    initializeHoverCard(invoker);
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const panel = target.closest(HOVERCARD_PANEL_SELECTOR);
  if (!isHoverCardPanel(panel)) {
    return;
  }

  const invoker = getHoverCardInvoker(panel);
  if (!invoker) {
    return;
  }

  event.preventDefault();
  closeHoverCard(invoker, { focusInvoker: true });
});

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  if (target.closest(HOVERCARD_SELECTOR) || target.closest(HOVERCARD_PANEL_SELECTOR)) {
    return;
  }

  closeOtherHoverCards();
});
