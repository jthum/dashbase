/*
 * Dashbase — Resizable behavior
 *
 * Enables drag and keyboard resizing for:
 *   <resizable-group class="horizontal|vertical">
 *     <resizable-pane>...</resizable-pane>
 *     <resizable-handle></resizable-handle>
 *     <resizable-pane>...</resizable-pane>
 *   </resizable-group>
 */

const RESIZABLE_GROUP_SELECTOR = "resizable-group";
const RESIZABLE_PANE_SELECTOR = "resizable-pane";
const RESIZABLE_HANDLE_SELECTOR = "resizable-handle";
const KEYBOARD_STEP = 24;
let resizablePaneCount = 0;

function isResizableGroup(value) {
  return value instanceof HTMLElement && value.matches(RESIZABLE_GROUP_SELECTOR);
}

function isResizablePane(value) {
  return value instanceof HTMLElement && value.matches(RESIZABLE_PANE_SELECTOR);
}

function isResizableHandle(value) {
  return value instanceof HTMLElement && value.matches(RESIZABLE_HANDLE_SELECTOR);
}

function isVerticalGroup(group) {
  return group.classList.contains("vertical");
}

function ensurePaneId(pane) {
  if (pane.id) {
    return pane.id;
  }

  resizablePaneCount += 1;
  pane.id = `resizable-pane-${resizablePaneCount}`;
  return pane.id;
}

function getAdjacentPane(handle, direction) {
  let sibling = direction === "previous"
    ? handle.previousElementSibling
    : handle.nextElementSibling;

  while (sibling) {
    if (isResizablePane(sibling)) {
      return sibling;
    }

    sibling = direction === "previous"
      ? sibling.previousElementSibling
      : sibling.nextElementSibling;
  }

  return null;
}

function getHandleState(handle) {
  const group = handle.parentElement;
  if (!isResizableGroup(group)) {
    return null;
  }

  const previousPane = getAdjacentPane(handle, "previous");
  const nextPane = getAdjacentPane(handle, "next");
  if (!previousPane || !nextPane) {
    return null;
  }

  return {
    group,
    previousPane,
    nextPane,
    vertical: isVerticalGroup(group),
  };
}

function getPaneSize(pane, vertical) {
  const rect = pane.getBoundingClientRect();
  return vertical ? rect.height : rect.width;
}

function getPaneMinSize(pane, vertical) {
  const styles = getComputedStyle(pane);
  const raw = vertical ? styles.minBlockSize : styles.minInlineSize;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function applyPaneSizes(group, previousPane, nextPane, previousSizePx, nextSizePx, vertical) {
  const total = vertical ? group.clientHeight : group.clientWidth;
  if (total <= 0) {
    return;
  }

  previousPane.style.setProperty("--pane-size", `${(previousSizePx / total) * 100}%`);
  nextPane.style.setProperty("--pane-size", `${(nextSizePx / total) * 100}%`);
}

function syncHandleAccessibility(handle) {
  const state = getHandleState(handle);
  if (!state) {
    return;
  }

  const { group, previousPane, nextPane, vertical } = state;
  const previousSize = getPaneSize(previousPane, vertical);
  const nextSize = getPaneSize(nextPane, vertical);
  const total = vertical ? group.clientHeight : group.clientWidth;
  const valueNow = total > 0 ? Math.round((previousSize / total) * 100) : 50;

  handle.setAttribute("role", "separator");
  handle.setAttribute("tabindex", handle.getAttribute("tabindex") || "0");
  handle.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
  handle.setAttribute("aria-valuemin", "0");
  handle.setAttribute("aria-valuemax", "100");
  handle.setAttribute("aria-valuenow", String(valueNow));
  handle.setAttribute("aria-valuetext", `${valueNow}%`);
  handle.setAttribute(
    "aria-controls",
    `${ensurePaneId(previousPane)} ${ensurePaneId(nextPane)}`,
  );

  if (!handle.hasAttribute("aria-label")) {
    handle.setAttribute("aria-label", "Resize panels");
  }
}

function resizeFromHandle(handle, deltaPx, baseSizes = null) {
  const state = getHandleState(handle);
  if (!state) {
    return;
  }

  const { group, previousPane, nextPane, vertical } = state;
  const previousSize = baseSizes?.previousSize ?? getPaneSize(previousPane, vertical);
  const nextSize = baseSizes?.nextSize ?? getPaneSize(nextPane, vertical);
  const minPrevious = getPaneMinSize(previousPane, vertical);
  const minNext = getPaneMinSize(nextPane, vertical);
  const combined = previousSize + nextSize;

  let nextPreviousSize = previousSize + deltaPx;
  nextPreviousSize = Math.max(minPrevious, nextPreviousSize);
  nextPreviousSize = Math.min(combined - minNext, nextPreviousSize);

  const nextNextSize = combined - nextPreviousSize;
  applyPaneSizes(group, previousPane, nextPane, nextPreviousSize, nextNextSize, vertical);
  syncHandleAccessibility(handle);
}

function moveHandleToLimit(handle, direction) {
  const state = getHandleState(handle);
  if (!state) {
    return;
  }

  const { group, previousPane, nextPane, vertical } = state;
  const previousSize = getPaneSize(previousPane, vertical);
  const nextSize = getPaneSize(nextPane, vertical);
  const minPrevious = getPaneMinSize(previousPane, vertical);
  const minNext = getPaneMinSize(nextPane, vertical);
  const combined = previousSize + nextSize;

  const nextPreviousSize = direction === "start"
    ? minPrevious
    : combined - minNext;
  const nextNextSize = combined - nextPreviousSize;

  applyPaneSizes(group, previousPane, nextPane, nextPreviousSize, nextNextSize, vertical);
  syncHandleAccessibility(handle);
}

function initializeHandle(handle) {
  syncHandleAccessibility(handle);
}

for (const handle of document.querySelectorAll(RESIZABLE_HANDLE_SELECTOR)) {
  if (isResizableHandle(handle)) {
    initializeHandle(handle);
  }
}

window.addEventListener("resize", () => {
  for (const handle of document.querySelectorAll(RESIZABLE_HANDLE_SELECTOR)) {
    if (isResizableHandle(handle)) {
      syncHandleAccessibility(handle);
    }
  }
});

document.addEventListener("pointerdown", (event) => {
  const handle = event.target instanceof HTMLElement
    ? event.target.closest(RESIZABLE_HANDLE_SELECTOR)
    : null;

  if (!isResizableHandle(handle)) {
    return;
  }

  const state = getHandleState(handle);
  if (!state) {
    return;
  }

  const { vertical } = state;
  const startPointer = vertical ? event.clientY : event.clientX;
  const startSizes = {
    previousSize: getPaneSize(state.previousPane, vertical),
    nextSize: getPaneSize(state.nextPane, vertical),
  };
  handle.setAttribute("data-active", "true");
  document.documentElement.style.cursor = vertical ? "row-resize" : "col-resize";
  document.body.style.userSelect = "none";

  if (handle.setPointerCapture) {
    handle.setPointerCapture(event.pointerId);
  }

  function cleanup() {
    handle.removeAttribute("data-active");
    document.documentElement.style.cursor = "";
    document.body.style.userSelect = "";
    if (handle.releasePointerCapture) {
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch {}
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(moveEvent) {
    const currentPointer = vertical ? moveEvent.clientY : moveEvent.clientX;
    resizeFromHandle(handle, currentPointer - startPointer, startSizes);
  }

  function onPointerUp() {
    cleanup();
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
});

document.addEventListener("keydown", (event) => {
  const handle = event.target instanceof HTMLElement
    ? event.target.closest(RESIZABLE_HANDLE_SELECTOR)
    : null;

  if (!isResizableHandle(handle)) {
    return;
  }

  const state = getHandleState(handle);
  if (!state) {
    return;
  }

  const { vertical } = state;
  const negativeKey = vertical ? "ArrowUp" : "ArrowLeft";
  const positiveKey = vertical ? "ArrowDown" : "ArrowRight";

  if (event.key === negativeKey) {
    event.preventDefault();
    resizeFromHandle(handle, -KEYBOARD_STEP);
    return;
  }

  if (event.key === positiveKey) {
    event.preventDefault();
    resizeFromHandle(handle, KEYBOARD_STEP);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    moveHandleToLimit(handle, "start");
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    moveHandleToLimit(handle, "end");
  }
});
