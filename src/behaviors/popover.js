/*
 * Dashbase — Popover behavior
 *
 * Enhances <popover-panel popover> with:
 * - aria-expanded / aria-controls sync for popover triggers
 * - menu keyboard navigation when role="menu" is present
 * - submenu coordination for nested popover-panel menus
 * - checkbox / radio state management through aria-checked
 */

const POPOVER_PANEL_SELECTOR = "popover-panel[popover]";
const MENU_PANEL_SELECTOR = 'popover-panel[popover][role="menu"]';
let panelCount = 0;

function isPopoverPanel(value) {
  return value instanceof HTMLElement && value.matches(POPOVER_PANEL_SELECTOR);
}

function isMenuPanel(value) {
  return isPopoverPanel(value) && value.getAttribute("role") === "menu";
}

function isDisabled(element) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function isMenuEntry(element) {
  return element.matches(
    'button, a, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  );
}

function isCheckboxItem(element) {
  return element.getAttribute("role") === "menuitemcheckbox";
}

function isRadioItem(element) {
  return element.getAttribute("role") === "menuitemradio";
}

function ensurePanelId(panel) {
  if (panel.id) {
    return panel.id;
  }

  panelCount += 1;
  panel.id = `dashbase-popover-panel-${panelCount}`;
  return panel.id;
}

function getPanelForTrigger(trigger) {
  const targetId = trigger.getAttribute("popovertarget");
  if (!targetId) {
    return null;
  }

  const panel = document.getElementById(targetId);
  return isPopoverPanel(panel) ? panel : null;
}

function getTriggersForPanel(panel) {
  const id = ensurePanelId(panel);
  return [...document.querySelectorAll(`[popovertarget="${CSS.escape(id)}"]`)]
    .filter((element) => element instanceof HTMLElement);
}

function getPrimaryTriggerForPanel(panel) {
  return getTriggersForPanel(panel)[0] ?? null;
}

function getParentMenu(panel) {
  const trigger = getPrimaryTriggerForPanel(panel);
  const parent = trigger?.closest(MENU_PANEL_SELECTOR);
  return isMenuPanel(parent) ? parent : null;
}

function getRootMenu(panel) {
  let current = panel;
  let parent = getParentMenu(current);

  while (parent) {
    current = parent;
    parent = getParentMenu(current);
  }

  return current;
}

function isSubmenuPanel(panel) {
  return getParentMenu(panel) !== null;
}

function getMenuEntries(panel) {
  if (!isMenuPanel(panel)) {
    return [];
  }

  return [...panel.children].flatMap((child) => {
    if (!(child instanceof HTMLElement) || child.matches(POPOVER_PANEL_SELECTOR)) {
      return [];
    }

    if (!isMenuEntry(child) || isDisabled(child)) {
      return [];
    }

    return [child];
  });
}

function prepareMenuEntries(panel) {
  for (const entry of getMenuEntries(panel)) {
    if (!entry.hasAttribute("tabindex")) {
      entry.tabIndex = -1;
    }
  }
}

function ensurePanelRelationship(panel) {
  const id = ensurePanelId(panel);

  for (const trigger of getTriggersForPanel(panel)) {
    trigger.setAttribute("aria-controls", id);

    if (isMenuPanel(panel) && !trigger.hasAttribute("aria-haspopup")) {
      trigger.setAttribute("aria-haspopup", "menu");
    }
  }

  if (isMenuPanel(panel)) {
    prepareMenuEntries(panel);
  }
}

function syncPanelState(panel) {
  const open = panel.matches(":popover-open");

  for (const trigger of getTriggersForPanel(panel)) {
    if (trigger.hasAttribute("aria-expanded") || isMenuPanel(panel)) {
      trigger.setAttribute("aria-expanded", String(open));
    }
  }
}

function closePanel(panel, { focusTrigger = false } = {}) {
  closeChildMenus(panel);

  if (panel.matches(":popover-open")) {
    panel.hidePopover();
  }

  if (focusTrigger) {
    getPrimaryTriggerForPanel(panel)?.focus();
  }
}

function closeChildMenus(panel) {
  if (!isMenuPanel(panel)) {
    return;
  }

  for (const entry of getMenuEntries(panel)) {
    const childPanel = getPanelForTrigger(entry);
    if (isMenuPanel(childPanel) && childPanel.matches(":popover-open")) {
      closePanel(childPanel);
    }
  }
}

function closeSiblingSubmenus(panel) {
  const parent = getParentMenu(panel);
  if (!parent) {
    return;
  }

  for (const entry of getMenuEntries(parent)) {
    const siblingPanel = getPanelForTrigger(entry);
    if (!isMenuPanel(siblingPanel) || siblingPanel === panel) {
      continue;
    }

    closePanel(siblingPanel);
  }
}

function closeOpenRootMenus({ except = null } = {}) {
  for (const panel of document.querySelectorAll(`${MENU_PANEL_SELECTOR}:popover-open`)) {
    if (!isMenuPanel(panel) || isSubmenuPanel(panel) || panel === except) {
      continue;
    }

    closePanel(panel);
  }
}

function getClosestMenuEntry(target) {
  const entry = target.closest(
    'button, a, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  );

  return entry instanceof HTMLElement ? entry : null;
}

function focusMenuEntry(panel, index) {
  const entries = getMenuEntries(panel);
  if (entries.length === 0) {
    return;
  }

  const safeIndex = Math.min(Math.max(index, 0), entries.length - 1);
  const target = entries[safeIndex];
  const childPanel = getPanelForTrigger(target);

  for (const entry of entries) {
    const submenu = getPanelForTrigger(entry);
    if (submenu && submenu !== childPanel) {
      closePanel(submenu);
    }
  }

  target.focus();
}

function openMenuPanel(panel) {
  ensurePanelRelationship(panel);

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }
}

function toggleCheckboxItem(item) {
  const checked = item.getAttribute("aria-checked") === "true";
  item.setAttribute("aria-checked", String(!checked));
}

function selectRadioItem(item) {
  const panel = item.parentElement;
  if (!(panel instanceof HTMLElement)) {
    item.setAttribute("aria-checked", "true");
    return;
  }

  const groupName = item.getAttribute("name");

  for (const sibling of panel.children) {
    if (!(sibling instanceof HTMLElement) || !isRadioItem(sibling)) {
      continue;
    }

    if (groupName && sibling.getAttribute("name") !== groupName) {
      continue;
    }

    sibling.setAttribute("aria-checked", String(sibling === item));
  }
}

function initializePanel(panel) {
  ensurePanelRelationship(panel);
  syncPanelState(panel);
}

for (const panel of document.querySelectorAll(POPOVER_PANEL_SELECTOR)) {
  if (isPopoverPanel(panel)) {
    initializePanel(panel);
  }
}

document.addEventListener("toggle", (event) => {
  const panel = isPopoverPanel(event.target) ? event.target : null;
  if (!panel) {
    return;
  }

  if (panel.matches(":popover-open") && isMenuPanel(panel)) {
    if (isSubmenuPanel(panel)) {
      closeSiblingSubmenus(panel);
    } else {
      closeOpenRootMenus({ except: panel });
    }
  } else if (!panel.matches(":popover-open")) {
    closeChildMenus(panel);
  }

  syncPanelState(panel);
});

document.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const panel = target.closest(MENU_PANEL_SELECTOR);
  if (!isMenuPanel(panel)) {
    return;
  }

  const entry = getClosestMenuEntry(target);
  if (!(entry instanceof HTMLElement) || isDisabled(entry)) {
    return;
  }

  const submenu = getPanelForTrigger(entry);
  if (isMenuPanel(submenu)) {
    return;
  }

  if (isCheckboxItem(entry)) {
    event.preventDefault();
    toggleCheckboxItem(entry);
    return;
  }

  if (isRadioItem(entry)) {
    event.preventDefault();
    selectRadioItem(entry);
    return;
  }

  closePanel(getRootMenu(panel), {
    focusTrigger: entry.tagName !== "A",
  });
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const triggerPanel = getPanelForTrigger(target);
  const activePanel = target.closest(MENU_PANEL_SELECTOR);
  const activeMenu = isMenuPanel(activePanel) ? activePanel : null;

  if (isMenuPanel(triggerPanel)) {
    const entries = getMenuEntries(triggerPanel);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenuPanel(triggerPanel);
      focusMenuEntry(triggerPanel, 0);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenuPanel(triggerPanel);
      focusMenuEntry(triggerPanel, entries.length - 1);
      return;
    }

    if (event.key === "ArrowRight" && activeMenu) {
      event.preventDefault();
      openMenuPanel(triggerPanel);
      focusMenuEntry(triggerPanel, 0);
      return;
    }

    if (event.key === "Escape" && triggerPanel.matches(":popover-open")) {
      event.preventDefault();
      closePanel(triggerPanel, { focusTrigger: true });
      return;
    }
  }

  if (!activeMenu) {
    return;
  }

  const entry = getClosestMenuEntry(target);
  const entries = getMenuEntries(activeMenu);
  const entryIndex = entry ? entries.indexOf(entry) : -1;

  if (event.key === "Escape") {
    event.preventDefault();
    closePanel(activeMenu, { focusTrigger: true });
    return;
  }

  if (event.key === "Tab") {
    closePanel(getRootMenu(activeMenu));
    return;
  }

  if (!entry || entryIndex === -1 || entries.length === 0) {
    return;
  }

  if (event.key === "ArrowRight") {
    const submenu = getPanelForTrigger(entry);
    if (isMenuPanel(submenu)) {
      event.preventDefault();
      openMenuPanel(submenu);
      focusMenuEntry(submenu, 0);
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    const parent = getParentMenu(activeMenu);
    if (parent) {
      event.preventDefault();
      closePanel(activeMenu, { focusTrigger: true });
    }
    return;
  }

  let nextIndex = null;

  if (event.key === "ArrowDown") {
    nextIndex = (entryIndex + 1) % entries.length;
  } else if (event.key === "ArrowUp") {
    nextIndex = (entryIndex - 1 + entries.length) % entries.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = entries.length - 1;
  }

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  focusMenuEntry(activeMenu, nextIndex);
});
