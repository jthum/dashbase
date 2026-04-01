/*
 * Dashbase — Dropdown behavior
 *
 * Enhances details.dropdown with:
 * - outside-click dismissal
 * - Escape to close
 * - Arrow/Home/End keyboard navigation across menu items
 * - optional focus handoff from summary to first/last item
 */

function getDropdownSummary(dropdown) {
  return dropdown.querySelector(":scope > summary");
}

function getDropdownPanel(dropdown) {
  const panel = dropdown.querySelector(":scope > dropdown-panel");
  return panel instanceof HTMLElement ? panel : null;
}

function getDropdownItems(dropdown) {
  const panel = getDropdownPanel(dropdown);
  if (!panel) {
    return [];
  }

  return [...panel.children].filter((child) => {
    if (!(child instanceof HTMLElement)) {
      return false;
    }

    if (!child.matches('button, a, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')) {
      return false;
    }

    return !child.hasAttribute("disabled") && child.getAttribute("aria-disabled") !== "true";
  });
}

function syncDropdownState(dropdown) {
  const summary = getDropdownSummary(dropdown);
  const panel = getDropdownPanel(dropdown);

  if (!(summary instanceof HTMLElement)) {
    return;
  }

  summary.setAttribute("aria-expanded", String(dropdown.open));

  if (panel?.getAttribute("role") === "menu") {
    summary.setAttribute("aria-haspopup", "menu");
  }
}

function closeDropdown(dropdown, { focusSummary = false } = {}) {
  if (!dropdown.open) {
    return;
  }

  dropdown.open = false;
  syncDropdownState(dropdown);

  if (focusSummary) {
    getDropdownSummary(dropdown)?.focus();
  }
}

function focusDropdownItem(dropdown, index) {
  const items = getDropdownItems(dropdown);
  if (items.length === 0) {
    return;
  }

  const safeIndex = Math.min(Math.max(index, 0), items.length - 1);
  items[safeIndex]?.focus();
}

function initializeDropdown(dropdown) {
  syncDropdownState(dropdown);
}

for (const dropdown of document.querySelectorAll("details.dropdown")) {
  if (dropdown instanceof HTMLDetailsElement) {
    initializeDropdown(dropdown);
  }
}

document.addEventListener("toggle", (event) => {
  const dropdown = event.target instanceof HTMLDetailsElement && event.target.matches("details.dropdown")
    ? event.target
    : null;

  if (!dropdown) {
    return;
  }

  if (dropdown.open) {
    for (const peer of document.querySelectorAll("details.dropdown[open]")) {
      if (peer instanceof HTMLDetailsElement && peer !== dropdown) {
        closeDropdown(peer);
      }
    }
  }

  syncDropdownState(dropdown);
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return;
  }

  const clickedDropdown = target.closest("details.dropdown");

  for (const dropdown of document.querySelectorAll("details.dropdown[open]")) {
    if (!(dropdown instanceof HTMLDetailsElement)) {
      continue;
    }

    if (clickedDropdown === dropdown) {
      const item = target.closest('dropdown-panel > button, dropdown-panel > a, dropdown-panel > [role="menuitem"], dropdown-panel > [role="menuitemcheckbox"], dropdown-panel > [role="menuitemradio"]');
      if (item instanceof HTMLElement) {
        closeDropdown(dropdown, { focusSummary: item.tagName !== "A" });
      }
      continue;
    }

    closeDropdown(dropdown);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const dropdown = target.closest("details.dropdown");
  if (!(dropdown instanceof HTMLDetailsElement)) {
    return;
  }

  const summary = getDropdownSummary(dropdown);
  const items = getDropdownItems(dropdown);
  const itemIndex = items.indexOf(target);

  if (event.key === "Escape") {
    if (dropdown.open) {
      event.preventDefault();
      closeDropdown(dropdown, { focusSummary: true });
    }
    return;
  }

  if (target === summary) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      dropdown.open = true;
      syncDropdownState(dropdown);
      focusDropdownItem(dropdown, 0);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      dropdown.open = true;
      syncDropdownState(dropdown);
      focusDropdownItem(dropdown, items.length - 1);
    }

    return;
  }

  if (itemIndex === -1 || items.length === 0) {
    return;
  }

  if (event.key === "Tab") {
    closeDropdown(dropdown);
    return;
  }

  let nextIndex = null;

  if (event.key === "ArrowDown") {
    nextIndex = (itemIndex + 1) % items.length;
  } else if (event.key === "ArrowUp") {
    nextIndex = (itemIndex - 1 + items.length) % items.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = items.length - 1;
  }

  if (nextIndex == null) {
    return;
  }

  event.preventDefault();
  items[nextIndex]?.focus();
});
