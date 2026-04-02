/*
 * Dashbase — Navigation Menu behavior
 *
 * Adds roving focus and top-level panel switching for:
 *   <nav class="navigation-menu"> ... </nav>
 *
 * The navigation panels themselves reuse <popover-panel popover>, while this
 * behavior only coordinates the root navigation items.
 */

const NAVIGATION_MENU_SELECTOR = "nav.navigation-menu";
const NAVIGATION_PANEL_SELECTOR = "popover-panel[popover]";

function isDisabledNavigationItem(item) {
  return (
    item.hasAttribute("disabled") ||
    item.getAttribute("aria-disabled") === "true"
  );
}

function getNavigationItems(menu) {
  return [...menu.children].filter((child) => {
    return (
      child instanceof HTMLElement &&
      child.matches(":where(a, button)") &&
      !isDisabledNavigationItem(child)
    );
  });
}

function getPanelForNavigationItem(item) {
  const targetId = item.getAttribute("popovertarget");
  if (!targetId) {
    return null;
  }

  const menu = item.closest(NAVIGATION_MENU_SELECTOR);
  if (!(menu instanceof HTMLElement)) {
    return null;
  }

  const panel = document.getElementById(targetId);
  return (
    panel instanceof HTMLElement &&
    panel.matches(NAVIGATION_PANEL_SELECTOR) &&
    panel.parentElement === menu
  ) ? panel : null;
}

function getInvokerForNavigationPanel(panel) {
  if (!panel.id) {
    return null;
  }

  const invoker = document.querySelector(`[popovertarget="${CSS.escape(panel.id)}"]`);
  return invoker instanceof HTMLElement ? invoker : null;
}

function hasOpenNavigationPanel(menu) {
  return getNavigationItems(menu).some((item) => {
    const panel = getPanelForNavigationItem(item);
    return panel instanceof HTMLElement && panel.matches(":popover-open");
  });
}

function closeOpenNavigationPanels(menu, { except = null } = {}) {
  for (const item of getNavigationItems(menu)) {
    const panel = getPanelForNavigationItem(item);
    if (!(panel instanceof HTMLElement) || panel === except || !panel.matches(":popover-open")) {
      continue;
    }

    panel.hidePopover();
  }
}

function setActiveNavigationItem(menu, activeItem) {
  const items = getNavigationItems(menu);
  if (!items.includes(activeItem)) {
    return;
  }

  for (const item of items) {
    item.tabIndex = item === activeItem ? 0 : -1;
  }
}

function focusNavigationItem(menu, index) {
  const items = getNavigationItems(menu);
  if (items.length === 0) {
    return null;
  }

  const safeIndex = (index + items.length) % items.length;
  const target = items[safeIndex];
  setActiveNavigationItem(menu, target);
  target.focus();
  return target;
}

function focusAdjacentNavigationItem(menu, currentItem, delta) {
  const items = getNavigationItems(menu);
  const currentIndex = items.indexOf(currentItem);
  if (currentIndex === -1) {
    return null;
  }

  return focusNavigationItem(menu, currentIndex + delta);
}

function openNavigationPanel(item) {
  const panel = getPanelForNavigationItem(item);
  if (!(panel instanceof HTMLElement)) {
    return null;
  }

  const menu = item.closest(NAVIGATION_MENU_SELECTOR);
  if (!(menu instanceof HTMLElement)) {
    return null;
  }

  closeOpenNavigationPanels(menu, { except: panel });

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }

  return panel;
}

function initializeNavigationMenu(menu) {
  const items = getNavigationItems(menu);
  if (items.length === 0) {
    return;
  }

  const activeItem = items.find((item) => item.tabIndex === 0) ?? items[0];
  setActiveNavigationItem(menu, activeItem);
}

for (const menu of document.querySelectorAll(NAVIGATION_MENU_SELECTOR)) {
  if (menu instanceof HTMLElement) {
    initializeNavigationMenu(menu);
  }
}

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const item = target?.closest(`${NAVIGATION_MENU_SELECTOR} > :where(a, button)`);
  if (!(item instanceof HTMLElement)) {
    return;
  }

  const menu = item.closest(NAVIGATION_MENU_SELECTOR);
  if (!(menu instanceof HTMLElement)) {
    return;
  }

  setActiveNavigationItem(menu, item);
});

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const item = target?.closest(`${NAVIGATION_MENU_SELECTOR} > :where(a, button)`);
  if (!(item instanceof HTMLElement)) {
    return;
  }

  const menu = item.closest(NAVIGATION_MENU_SELECTOR);
  if (!(menu instanceof HTMLElement) || !hasOpenNavigationPanel(menu)) {
    return;
  }

  setActiveNavigationItem(menu, item);

  if (getPanelForNavigationItem(item)) {
    openNavigationPanel(item);
  } else {
    closeOpenNavigationPanels(menu);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const directItem = target.closest(`${NAVIGATION_MENU_SELECTOR} > :where(a, button)`);
  if (directItem instanceof HTMLElement) {
    const menu = directItem.closest(NAVIGATION_MENU_SELECTOR);
    if (!(menu instanceof HTMLElement)) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextItem = focusAdjacentNavigationItem(menu, directItem, 1);
      if (nextItem && hasOpenNavigationPanel(menu)) {
        if (getPanelForNavigationItem(nextItem)) {
          openNavigationPanel(nextItem);
        } else {
          closeOpenNavigationPanels(menu);
        }
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previousItem = focusAdjacentNavigationItem(menu, directItem, -1);
      if (previousItem && hasOpenNavigationPanel(menu)) {
        if (getPanelForNavigationItem(previousItem)) {
          openNavigationPanel(previousItem);
        } else {
          closeOpenNavigationPanels(menu);
        }
      }
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusNavigationItem(menu, 0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusNavigationItem(menu, getNavigationItems(menu).length - 1);
      return;
    }

    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      if (getPanelForNavigationItem(directItem)) {
        event.preventDefault();
        openNavigationPanel(directItem);
      }
      return;
    }

    if (event.key === "Escape") {
      const panel = getPanelForNavigationItem(directItem);
      if (panel instanceof HTMLElement && panel.matches(":popover-open")) {
        event.preventDefault();
        panel.hidePopover();
      }
    }
    return;
  }

  const panel = target.closest(NAVIGATION_PANEL_SELECTOR);
  if (!(panel instanceof HTMLElement)) {
    return;
  }

  const invoker = getInvokerForNavigationPanel(panel);
  if (!(invoker instanceof HTMLElement)) {
    return;
  }

  const menu = invoker.closest(NAVIGATION_MENU_SELECTOR);
  if (!(menu instanceof HTMLElement)) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    panel.hidePopover();
    invoker.focus();
    return;
  }

  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    const nextItem = focusAdjacentNavigationItem(menu, invoker, event.key === "ArrowRight" ? 1 : -1);
    if (nextItem && getPanelForNavigationItem(nextItem)) {
      openNavigationPanel(nextItem);
    } else {
      closeOpenNavigationPanels(menu);
    }
  }
});
