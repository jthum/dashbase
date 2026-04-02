/*
 * Dashbase — Command behavior
 *
 * Enhances dialogs that contain <command-list> with:
 * - filtering via a search input
 * - keyboard navigation across visible command items
 * - optional open shortcut via data-command-shortcut="mod+k"
 */

const COMMAND_DIALOG_SELECTOR = "dialog";
const COMMAND_LIST_SELECTOR = "command-list";
const COMMAND_GROUP_SELECTOR = "command-group";
const COMMAND_EMPTY_SELECTOR = "command-empty";
const COMMAND_ITEM_SELECTOR = "command-group > a, command-group > button";
const COMMAND_SEARCH_SELECTOR = 'command-search > input[type="search"]';

function isCommandDialog(value) {
  return (
    value instanceof HTMLDialogElement &&
    value.querySelector(COMMAND_LIST_SELECTOR) instanceof HTMLElement
  );
}

function getCommandSearch(dialog) {
  const input = dialog.querySelector(COMMAND_SEARCH_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function getCommandItems(dialog) {
  return [...dialog.querySelectorAll(COMMAND_ITEM_SELECTOR)]
    .filter((item) => item instanceof HTMLElement);
}

function getVisibleCommandItems(dialog) {
  return getCommandItems(dialog).filter((item) => !item.hidden);
}

function getCommandGroups(dialog) {
  return [...dialog.querySelectorAll(COMMAND_GROUP_SELECTOR)]
    .filter((group) => group instanceof HTMLElement);
}

function getCommandEmpty(dialog) {
  const empty = dialog.querySelector(COMMAND_EMPTY_SELECTOR);
  return empty instanceof HTMLElement ? empty : null;
}

function getCommandText(item) {
  const keywords = item.getAttribute("data-keywords") ?? "";
  return `${item.textContent ?? ""} ${keywords}`.trim().toLowerCase();
}

function focusCommandSearch(dialog) {
  const search = getCommandSearch(dialog);
  if (!search) {
    return;
  }

  requestAnimationFrame(() => {
    search.focus();
    search.select();
  });
}

function syncActiveItem(dialog, nextItem) {
  for (const item of getCommandItems(dialog)) {
    if (nextItem && item === nextItem) {
      item.setAttribute("aria-selected", "true");
      item.tabIndex = 0;
    } else {
      item.removeAttribute("aria-selected");
      item.tabIndex = -1;
    }
  }
}

function syncEmptyState(dialog) {
  const empty = getCommandEmpty(dialog);
  if (!empty) {
    return;
  }

  empty.hidden = getVisibleCommandItems(dialog).length !== 0;
}

function syncGroupVisibility(dialog) {
  for (const group of getCommandGroups(dialog)) {
    const items = [...group.querySelectorAll(":scope > a, :scope > button")]
      .filter((item) => item instanceof HTMLElement);
    group.hidden = items.every((item) => item.hidden);
  }
}

function applyFilter(dialog) {
  const search = getCommandSearch(dialog);
  const query = search?.value.trim().toLowerCase() ?? "";

  for (const item of getCommandItems(dialog)) {
    item.hidden = query.length > 0 && !getCommandText(item).includes(query);
  }

  syncGroupVisibility(dialog);
  syncEmptyState(dialog);

  const current = dialog.querySelector('[aria-selected="true"]');
  const visibleItems = getVisibleCommandItems(dialog);
  if (!(current instanceof HTMLElement) || current.hidden) {
    syncActiveItem(dialog, visibleItems[0] ?? null);
  }
}

function moveActiveItem(dialog, delta) {
  const visibleItems = getVisibleCommandItems(dialog);
  if (visibleItems.length === 0) {
    return;
  }

  const current = dialog.querySelector('[aria-selected="true"]');
  const currentIndex = current instanceof HTMLElement ? visibleItems.indexOf(current) : -1;
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + delta + visibleItems.length) % visibleItems.length;
  const nextItem = visibleItems[nextIndex];
  syncActiveItem(dialog, nextItem);
  nextItem.focus();
}

function activateSelectedItem(dialog) {
  const selected = dialog.querySelector('[aria-selected="true"]');
  if (selected instanceof HTMLElement && !selected.hidden) {
    selected.click();
  }
}

function resetCommandDialog(dialog) {
  const search = getCommandSearch(dialog);
  if (search) {
    search.value = "";
  }

  applyFilter(dialog);
  syncActiveItem(dialog, getVisibleCommandItems(dialog)[0] ?? null);
}

function initializeCommandDialog(dialog) {
  const search = getCommandSearch(dialog);
  syncActiveItem(dialog, getVisibleCommandItems(dialog)[0] ?? null);
  applyFilter(dialog);

  search?.addEventListener("input", () => {
    applyFilter(dialog);
  });

  const observer = new MutationObserver(() => {
    if (!dialog.open) {
      return;
    }

    resetCommandDialog(dialog);
    focusCommandSearch(dialog);
  });

  observer.observe(dialog, {
    attributes: true,
    attributeFilter: ["open"],
  });
}

for (const dialog of document.querySelectorAll(COMMAND_DIALOG_SELECTOR)) {
  if (isCommandDialog(dialog)) {
    initializeCommandDialog(dialog);
  }
}

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const dialog = target?.closest(COMMAND_DIALOG_SELECTOR);

  if (!(dialog instanceof HTMLDialogElement) || !isCommandDialog(dialog)) {
    const isModK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
    if (!isModK) {
      return;
    }

    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      (active.matches('input, textarea, select, [contenteditable="true"]') || active.isContentEditable)
    ) {
      return;
    }

    const shortcutDialog = [...document.querySelectorAll(COMMAND_DIALOG_SELECTOR)]
      .find((candidate) => {
        return (
          candidate instanceof HTMLDialogElement &&
          isCommandDialog(candidate) &&
          (candidate.getAttribute("data-command-shortcut") ?? "").toLowerCase() === "mod+k"
        );
      });

    if (!(shortcutDialog instanceof HTMLDialogElement)) {
      return;
    }

    event.preventDefault();
    if (!shortcutDialog.open) {
      shortcutDialog.showModal();
    }
    const search = getCommandSearch(shortcutDialog);
    search?.focus();
    search?.select();
    return;
  }

  const search = getCommandSearch(dialog);
  const visibleItems = getVisibleCommandItems(dialog);

  if (event.key === "ArrowDown") {
    if (target === search || target?.matches(COMMAND_ITEM_SELECTOR)) {
      event.preventDefault();
      moveActiveItem(dialog, 1);
    }
    return;
  }

  if (event.key === "ArrowUp") {
    if (target === search || target?.matches(COMMAND_ITEM_SELECTOR)) {
      event.preventDefault();
      moveActiveItem(dialog, -1);
    }
    return;
  }

  if (event.key === "Home" && target?.matches(COMMAND_ITEM_SELECTOR)) {
    event.preventDefault();
    const first = visibleItems[0] ?? null;
    syncActiveItem(dialog, first);
    first?.focus();
    return;
  }

  if (event.key === "End" && target?.matches(COMMAND_ITEM_SELECTOR)) {
    event.preventDefault();
    const last = visibleItems[visibleItems.length - 1] ?? null;
    syncActiveItem(dialog, last);
    last?.focus();
    return;
  }

  if (event.key === "Enter" && target === search) {
    event.preventDefault();
    activateSelectedItem(dialog);
  }
});

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target?.matches(COMMAND_ITEM_SELECTOR)) {
    return;
  }

  const dialog = target.closest(COMMAND_DIALOG_SELECTOR);
  if (!(dialog instanceof HTMLDialogElement) || !isCommandDialog(dialog)) {
    return;
  }

  syncActiveItem(dialog, target);
});

document.addEventListener("click", (event) => {
  const item = event.target instanceof Element
    ? event.target.closest(COMMAND_ITEM_SELECTOR)
    : null;

  if (!(item instanceof HTMLElement)) {
    return;
  }

  const dialog = item.closest(COMMAND_DIALOG_SELECTOR);
  if (!(dialog instanceof HTMLDialogElement) || !isCommandDialog(dialog)) {
    return;
  }

  syncActiveItem(dialog, item);

  if (item.hasAttribute("data-command-stay-open")) {
    return;
  }

  if (
    item instanceof HTMLAnchorElement &&
    (item.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
  ) {
    return;
  }

  if (dialog.open) {
    dialog.close();
  }
});

document.addEventListener("close", (event) => {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement) || !isCommandDialog(dialog)) {
    return;
  }

  resetCommandDialog(dialog);
});

document.addEventListener("cancel", (event) => {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement) || !isCommandDialog(dialog)) {
    return;
  }

  resetCommandDialog(dialog);
});
