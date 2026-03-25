/*
 * Dashbase — Dropdown menu behavior shim
 *
 * Closes menus on outside interaction, syncs ARIA state, and provides basic
 * keyboard navigation for the native <details> / <summary> pattern.
 */

const DROPDOWN_SELECTOR = "details.dropdown-menu";

function getDropdowns(root = document) {
  const dropdowns = [];

  if (root instanceof Element && root.matches(DROPDOWN_SELECTOR)) {
    dropdowns.push(root);
  }

  if ("querySelectorAll" in root && typeof root.querySelectorAll === "function") {
    dropdowns.push(...root.querySelectorAll(DROPDOWN_SELECTOR));
  }

  return dropdowns;
}

function getSummary(dropdown) {
  return dropdown.querySelector("summary");
}

function getMenu(dropdown) {
  return [...dropdown.children].find((child) =>
    child instanceof HTMLElement
    && ["menu", "ul"].includes(child.localName),
  ) ?? null;
}

function getItems(dropdown) {
  const menu = getMenu(dropdown);
  if (!(menu instanceof HTMLElement)) {
    return [];
  }

  return [...menu.querySelectorAll("a[href], button")]
    .filter((item) => !item.matches("[disabled], [aria-disabled=\"true\"]"));
}

function syncDropdown(dropdown) {
  const summary = getSummary(dropdown);
  const menu = getMenu(dropdown);
  if (!(summary instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  summary.setAttribute("aria-haspopup", "menu");
  summary.setAttribute("aria-expanded", String(dropdown.open));
  menu.setAttribute("role", "menu");

  for (const item of getItems(dropdown)) {
    if (!item.getAttribute("role")) {
      item.setAttribute("role", "menuitem");
    }
  }
}

function closeDropdown(dropdown, { focusSummary = false } = {}) {
  if (!(dropdown instanceof HTMLDetailsElement)) {
    return;
  }

  dropdown.open = false;
  syncDropdown(dropdown);

  if (focusSummary) {
    getSummary(dropdown)?.focus();
  }
}

function closeOtherDropdowns(activeDropdown) {
  for (const dropdown of getDropdowns()) {
    if (dropdown !== activeDropdown && dropdown.open) {
      closeDropdown(dropdown);
    }
  }
}

function focusMenuItem(dropdown, index) {
  const items = getItems(dropdown);
  const nextItem = items[index];
  if (nextItem) {
    nextItem.focus();
  }
}

function moveMenuFocus(dropdown, currentItem, direction) {
  const items = getItems(dropdown);
  const currentIndex = items.indexOf(currentItem);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = (currentIndex + direction + items.length) % items.length;
  focusMenuItem(dropdown, nextIndex);
}

function initDropdown(dropdown) {
  if (!(dropdown instanceof HTMLDetailsElement) || dropdown.dataset.dropdownInitialized === "true") {
    return;
  }

  const summary = getSummary(dropdown);
  const menu = getMenu(dropdown);
  if (!(summary instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
    return;
  }

  syncDropdown(dropdown);

  dropdown.addEventListener("toggle", () => {
    if (dropdown.open) {
      closeOtherDropdowns(dropdown);
    }

    syncDropdown(dropdown);
  });

  summary.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      dropdown.open = true;
      syncDropdown(dropdown);
      closeOtherDropdowns(dropdown);
      focusMenuItem(dropdown, 0);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      dropdown.open = true;
      syncDropdown(dropdown);
      closeOtherDropdowns(dropdown);
      const items = getItems(dropdown);
      focusMenuItem(dropdown, items.length - 1);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown(dropdown, { focusSummary: true });
    }
  });

  menu.addEventListener("keydown", (event) => {
    const currentItem = event.target instanceof HTMLElement
      ? event.target.closest('[role="menuitem"]')
      : null;

    if (!(currentItem instanceof HTMLElement)) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveMenuFocus(dropdown, currentItem, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveMenuFocus(dropdown, currentItem, -1);
        break;
      case "Home":
        event.preventDefault();
        focusMenuItem(dropdown, 0);
        break;
      case "End": {
        event.preventDefault();
        const items = getItems(dropdown);
        focusMenuItem(dropdown, items.length - 1);
        break;
      }
      case "Escape":
        event.preventDefault();
        closeDropdown(dropdown, { focusSummary: true });
        break;
      default:
        break;
    }
  });

  menu.addEventListener("click", (event) => {
    const item = event.target instanceof HTMLElement
      ? event.target.closest('[role="menuitem"]')
      : null;

    if (!(item instanceof HTMLElement)) {
      return;
    }

    closeDropdown(dropdown);
  });

  dropdown.dataset.dropdownInitialized = "true";
}

function initDropdownMenus(root = document) {
  getDropdowns(root).forEach(initDropdown);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  for (const dropdown of getDropdowns()) {
    if (dropdown.open && !dropdown.contains(target)) {
      closeDropdown(dropdown);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  for (const dropdown of getDropdowns()) {
    if (dropdown.open) {
      closeDropdown(dropdown, { focusSummary: true });
      break;
    }
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initDropdownMenus(), { once: true });
} else {
  initDropdownMenus();
}

window.Dashbase ??= {};
window.Dashbase.initDropdownMenus = initDropdownMenus;
