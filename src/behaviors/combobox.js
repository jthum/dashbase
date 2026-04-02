/*
 * Dashbase — Combobox behavior
 *
 * Enhances <combo-box> roots with:
 * - filtering via a text input
 * - keyboard navigation across listbox options
 * - selection that writes back to the input value
 * - popover positioning anchored to the input
 */

const COMBOBOX_ROOT_SELECTOR = "combo-box";
const COMBOBOX_INPUT_SELECTOR = 'input[role="combobox"]';
const COMBOBOX_PANEL_SELECTOR = 'popover-panel[popover][role="listbox"]';
const COMBOBOX_OPTION_SELECTOR = 'button[role="option"]';
const COMBOBOX_EMPTY_SELECTOR = "combobox-empty";
const COMBOBOX_MARGIN = 16;
let comboboxCount = 0;

function isComboboxRoot(value) {
  return value instanceof HTMLElement && value.matches(COMBOBOX_ROOT_SELECTOR);
}

function getComboboxInput(root) {
  const input = root.querySelector(`:scope > ${COMBOBOX_INPUT_SELECTOR}`);
  return input instanceof HTMLInputElement ? input : null;
}

function getComboboxPanel(root) {
  const panel = root.querySelector(`:scope > ${COMBOBOX_PANEL_SELECTOR}`);
  return panel instanceof HTMLElement ? panel : null;
}

function getComboboxEmpty(root) {
  const empty = root.querySelector(`:scope > ${COMBOBOX_PANEL_SELECTOR} > ${COMBOBOX_EMPTY_SELECTOR}`);
  return empty instanceof HTMLElement ? empty : null;
}

function getComboboxOptions(root) {
  const panel = getComboboxPanel(root);
  if (!panel) {
    return [];
  }

  return [...panel.querySelectorAll(`:scope > ${COMBOBOX_OPTION_SELECTOR}`)]
    .filter((option) => option instanceof HTMLButtonElement);
}

function getVisibleComboboxOptions(root) {
  return getComboboxOptions(root).filter((option) => !option.hidden);
}

function ensureComboboxIds(root) {
  const input = getComboboxInput(root);
  const panel = getComboboxPanel(root);
  if (!input || !panel) {
    return;
  }

  if (!panel.id) {
    comboboxCount += 1;
    panel.id = `dashbase-combobox-panel-${comboboxCount}`;
  }

  input.setAttribute("aria-controls", panel.id);

  let optionIndex = 0;
  for (const option of getComboboxOptions(root)) {
    if (!option.id) {
      optionIndex += 1;
      option.id = `${panel.id}-option-${optionIndex}`;
    }
  }
}

function getOptionText(option) {
  return (option.getAttribute("data-label") ?? option.textContent ?? "").trim();
}

function getOptionFilterText(option) {
  const keywords = option.getAttribute("data-keywords") ?? "";
  return `${getOptionText(option)} ${keywords}`.trim().toLowerCase();
}

function syncExpandedState(root) {
  const input = getComboboxInput(root);
  const panel = getComboboxPanel(root);
  if (!input || !panel) {
    return;
  }

  input.setAttribute("aria-expanded", String(panel.matches(":popover-open")));
}

function syncEmptyState(root) {
  const empty = getComboboxEmpty(root);
  if (!empty) {
    return;
  }

  empty.hidden = getVisibleComboboxOptions(root).length !== 0;
}

function syncActiveOption(root, nextOption) {
  const input = getComboboxInput(root);
  if (!input) {
    return;
  }

  for (const option of getComboboxOptions(root)) {
    if (nextOption && option === nextOption) {
      option.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", option.id);
    } else {
      option.removeAttribute("aria-selected");
    }
  }

  if (!nextOption) {
    input.removeAttribute("aria-activedescendant");
  }
}

function getActiveOption(root) {
  const active = getComboboxPanel(root)?.querySelector(`${COMBOBOX_OPTION_SELECTOR}[aria-selected="true"]`);
  return active instanceof HTMLButtonElement ? active : null;
}

function positionComboboxPanel(root) {
  const input = getComboboxInput(root);
  const panel = getComboboxPanel(root);
  if (!input || !panel) {
    return;
  }

  const rect = input.getBoundingClientRect();
  let inlineStart = rect.left;
  const inlineSize = rect.width;
  let blockStart = rect.bottom + 4;

  panel.style.setProperty("--combobox-inline-size", `${inlineSize}px`);
  panel.style.setProperty("--combobox-inline-start", `${inlineStart}px`);
  panel.style.setProperty("--combobox-block-start", `${blockStart}px`);

  requestAnimationFrame(() => {
    const panelRect = panel.getBoundingClientRect();
    let nextInlineStart = inlineStart;
    let nextBlockStart = blockStart;

    if (panelRect.right > window.innerWidth - COMBOBOX_MARGIN) {
      nextInlineStart = Math.max(
        COMBOBOX_MARGIN,
        inlineStart - (panelRect.right - (window.innerWidth - COMBOBOX_MARGIN)),
      );
    }

    if (panelRect.bottom > window.innerHeight - COMBOBOX_MARGIN) {
      const above = rect.top - panelRect.height - 4;
      if (above >= COMBOBOX_MARGIN) {
        nextBlockStart = above;
      } else {
        nextBlockStart = Math.max(
          COMBOBOX_MARGIN,
          blockStart - (panelRect.bottom - (window.innerHeight - COMBOBOX_MARGIN)),
        );
      }
    }

    panel.style.setProperty("--combobox-inline-start", `${nextInlineStart}px`);
    panel.style.setProperty("--combobox-block-start", `${nextBlockStart}px`);
  });
}

function openCombobox(root) {
  const panel = getComboboxPanel(root);
  if (!panel) {
    return;
  }

  closeOpenComboboxes(root);
  positionComboboxPanel(root);

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }

  syncExpandedState(root);
}

function closeCombobox(root) {
  const panel = getComboboxPanel(root);
  if (!panel) {
    return;
  }

  if (panel.matches(":popover-open")) {
    panel.hidePopover();
  }

  syncExpandedState(root);
}

function closeOpenComboboxes(except = null) {
  for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
    if (!isComboboxRoot(root) || root === except) {
      continue;
    }

    closeCombobox(root);
  }
}

function applyFilter(root) {
  const input = getComboboxInput(root);
  if (!input) {
    return;
  }

  const query = input.value.trim().toLowerCase();

  for (const option of getComboboxOptions(root)) {
    option.hidden = query.length > 0 && !getOptionFilterText(option).includes(query);
  }

  syncEmptyState(root);

  const active = getActiveOption(root);
  if (active && !active.hidden) {
    return;
  }

  syncActiveOption(root, getVisibleComboboxOptions(root)[0] ?? null);
}

function moveActiveOption(root, delta) {
  const options = getVisibleComboboxOptions(root);
  if (options.length === 0) {
    syncActiveOption(root, null);
    return;
  }

  const current = getActiveOption(root);
  const currentIndex = current ? options.indexOf(current) : -1;
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + delta + options.length) % options.length;
  const nextOption = options[nextIndex];

  syncActiveOption(root, nextOption);
  nextOption.scrollIntoView({ block: "nearest" });
}

function selectOption(root, option) {
  const input = getComboboxInput(root);
  if (!input) {
    return;
  }

  input.value = getOptionText(option);
  if (option.hasAttribute("data-value")) {
    input.setAttribute("data-value", option.getAttribute("data-value") ?? "");
  } else {
    input.removeAttribute("data-value");
  }

  syncActiveOption(root, option);
  closeCombobox(root);
  input.focus();
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function initializeCombobox(root) {
  const input = getComboboxInput(root);
  const panel = getComboboxPanel(root);
  if (!input || !panel) {
    return;
  }

  ensureComboboxIds(root);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-autocomplete", input.getAttribute("aria-autocomplete") || "list");
  syncActiveOption(root, getVisibleComboboxOptions(root)[0] ?? null);
  syncEmptyState(root);

  input.addEventListener("focus", () => {
    applyFilter(root);
    openCombobox(root);
  });

  input.addEventListener("click", () => {
    applyFilter(root);
    openCombobox(root);
  });

  input.addEventListener("input", () => {
    applyFilter(root);
    openCombobox(root);
  });

  input.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!panel.matches(":popover-open")) {
          openCombobox(root);
        }
        moveActiveOption(root, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!panel.matches(":popover-open")) {
          openCombobox(root);
        }
        moveActiveOption(root, -1);
        break;
      case "Home":
        if (panel.matches(":popover-open")) {
          event.preventDefault();
          syncActiveOption(root, getVisibleComboboxOptions(root)[0] ?? null);
        }
        break;
      case "End":
        if (panel.matches(":popover-open")) {
          event.preventDefault();
          const options = getVisibleComboboxOptions(root);
          syncActiveOption(root, options[options.length - 1] ?? null);
        }
        break;
      case "Enter": {
        if (!panel.matches(":popover-open")) {
          return;
        }

        const active = getActiveOption(root);
        if (!active) {
          return;
        }

        event.preventDefault();
        selectOption(root, active);
        break;
      }
      case "Escape":
        if (panel.matches(":popover-open")) {
          event.preventDefault();
          closeCombobox(root);
        }
        break;
      default:
        break;
    }
  });

  panel.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(COMBOBOX_OPTION_SELECTOR)) {
      event.preventDefault();
    }
  });

  panel.addEventListener("mousemove", (event) => {
    const option = event.target instanceof Element
      ? event.target.closest(COMBOBOX_OPTION_SELECTOR)
      : null;

    if (!(option instanceof HTMLButtonElement) || option.hidden) {
      return;
    }

    syncActiveOption(root, option);
  });

  panel.addEventListener("click", (event) => {
    const option = event.target instanceof Element
      ? event.target.closest(COMBOBOX_OPTION_SELECTOR)
      : null;

    if (!(option instanceof HTMLButtonElement) || option.hidden) {
      return;
    }

    selectOption(root, option);
  });

  panel.addEventListener("toggle", () => {
    syncExpandedState(root);
    if (panel.matches(":popover-open")) {
      positionComboboxPanel(root);
    }
  });
}

for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
  if (isComboboxRoot(root)) {
    initializeCombobox(root);
  }
}

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;

  for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
    if (!isComboboxRoot(root)) {
      continue;
    }

    const panel = getComboboxPanel(root);
    if (!panel?.matches(":popover-open")) {
      continue;
    }

    if (target && (root.contains(target) || panel.contains(target))) {
      continue;
    }

    closeCombobox(root);
  }
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof Element ? event.target : null;

  for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
    if (!isComboboxRoot(root)) {
      continue;
    }

    const panel = getComboboxPanel(root);
    if (!panel?.matches(":popover-open")) {
      continue;
    }

    if (target && (root.contains(target) || panel.contains(target))) {
      continue;
    }

    closeCombobox(root);
  }
});

window.addEventListener("resize", () => {
  for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
    if (!isComboboxRoot(root)) {
      continue;
    }

    const panel = getComboboxPanel(root);
    if (panel?.matches(":popover-open")) {
      positionComboboxPanel(root);
    }
  }
});

window.addEventListener("scroll", () => {
  for (const root of document.querySelectorAll(COMBOBOX_ROOT_SELECTOR)) {
    if (!isComboboxRoot(root)) {
      continue;
    }

    const panel = getComboboxPanel(root);
    if (panel?.matches(":popover-open")) {
      positionComboboxPanel(root);
    }
  }
}, true);
