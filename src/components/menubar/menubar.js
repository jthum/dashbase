/*
 * Dashbase — Menubar behavior
 *
 * Adds roving focus and top-level menu switching for:
 *   <menu-bar role="menubar"> ... </menu-bar>
 *
 * Menubar items reuse <popover-panel popover role="menu"> for their submenus,
 * with popover.js continuing to own menu-internal navigation and submenu logic.
 */

const MENUBAR_SELECTOR = 'menu-bar[role="menubar"]';
const MENU_PANEL_SELECTOR = 'popover-panel[popover][role="menu"]';

function isDisabledMenuBarItem(item) {
  return (
    item.hasAttribute("disabled") ||
    item.getAttribute("aria-disabled") === "true"
  );
}

function getMenuBarItems(menuBar) {
  return [...menuBar.children].filter((child) => {
    return (
      child instanceof HTMLElement &&
      child.getAttribute("role") === "menuitem" &&
      !isDisabledMenuBarItem(child)
    );
  });
}

function getMenuPanelItems(panel) {
  return [...panel.children].filter((child) => {
    return (
      child instanceof HTMLElement &&
      !child.matches(MENU_PANEL_SELECTOR) &&
      child.matches('button, a, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]') &&
      !child.hasAttribute("disabled") &&
      child.getAttribute("aria-disabled") !== "true"
    );
  });
}

function getPanelForItem(item) {
  const targetId = item.getAttribute("popovertarget");
  if (!targetId) {
    return null;
  }

  const panel = document.getElementById(targetId);
  return panel instanceof HTMLElement && panel.matches(MENU_PANEL_SELECTOR) ? panel : null;
}

function getInvokerForPanel(panel) {
  if (!panel.id) {
    return null;
  }

  const invoker = document.querySelector(`[popovertarget="${CSS.escape(panel.id)}"]`);
  return invoker instanceof HTMLElement ? invoker : null;
}

function isRootMenuPanel(panel) {
  const invoker = getInvokerForPanel(panel);
  return invoker instanceof HTMLElement && invoker.closest(MENUBAR_SELECTOR) instanceof HTMLElement;
}

function setActiveMenuBarItem(menuBar, activeItem) {
  const items = getMenuBarItems(menuBar);
  if (!items.includes(activeItem)) {
    return;
  }

  for (const item of items) {
    item.tabIndex = item === activeItem ? 0 : -1;
  }
}

function focusMenuBarItem(menuBar, index) {
  const items = getMenuBarItems(menuBar);
  if (items.length === 0) {
    return null;
  }

  const safeIndex = (index + items.length) % items.length;
  const target = items[safeIndex];
  setActiveMenuBarItem(menuBar, target);
  target.focus();
  return target;
}

function focusAdjacentMenuBarItem(menuBar, currentItem, delta) {
  const items = getMenuBarItems(menuBar);
  const currentIndex = items.indexOf(currentItem);
  if (currentIndex === -1) {
    return null;
  }

  return focusMenuBarItem(menuBar, currentIndex + delta);
}

function openMenuForItem(item, { focus = "first" } = {}) {
  const panel = getPanelForItem(item);
  if (!(panel instanceof HTMLElement)) {
    return null;
  }

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }

  if (focus === false) {
    return panel;
  }

  requestAnimationFrame(() => {
    const menuItems = getMenuPanelItems(panel);
    if (menuItems.length === 0) {
      return;
    }

    const target = focus === "last" ? menuItems[menuItems.length - 1] : menuItems[0];
    target.focus();
  });

  return panel;
}

function hasOpenRootMenu(menuBar) {
  return getMenuBarItems(menuBar).some((item) => {
    const panel = getPanelForItem(item);
    return panel instanceof HTMLElement && panel.matches(":popover-open");
  });
}

function closeOpenRootMenus(menuBar, { except = null } = {}) {
  for (const item of getMenuBarItems(menuBar)) {
    const panel = getPanelForItem(item);
    if (!(panel instanceof HTMLElement) || panel === except || !panel.matches(":popover-open")) {
      continue;
    }

    panel.hidePopover();
  }
}

function initializeMenuBar(menuBar) {
  const items = getMenuBarItems(menuBar);
  if (items.length === 0) {
    return;
  }

  const activeItem = items.find((item) => item.tabIndex === 0) ?? items[0];
  setActiveMenuBarItem(menuBar, activeItem);
}

for (const menuBar of document.querySelectorAll(MENUBAR_SELECTOR)) {
  if (menuBar instanceof HTMLElement) {
    initializeMenuBar(menuBar);
  }
}

document.addEventListener("focusin", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const item = target?.closest(`${MENUBAR_SELECTOR} > [role="menuitem"]`);
  if (!(item instanceof HTMLElement)) {
    return;
  }

  const menuBar = item.closest(MENUBAR_SELECTOR);
  if (!(menuBar instanceof HTMLElement)) {
    return;
  }

  setActiveMenuBarItem(menuBar, item);
});

document.addEventListener("pointerover", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const item = target?.closest(`${MENUBAR_SELECTOR} > [role="menuitem"]`);
  if (!(item instanceof HTMLElement)) {
    return;
  }

  const menuBar = item.closest(MENUBAR_SELECTOR);
  if (!(menuBar instanceof HTMLElement) || !hasOpenRootMenu(menuBar)) {
    return;
  }

  setActiveMenuBarItem(menuBar, item);

  if (getPanelForItem(item)) {
    openMenuForItem(item, { focus: false });
  } else {
    closeOpenRootMenus(menuBar);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const directItem = target.closest(`${MENUBAR_SELECTOR} > [role="menuitem"]`);
  if (directItem instanceof HTMLElement) {
    const menuBar = directItem.closest(MENUBAR_SELECTOR);
    if (!(menuBar instanceof HTMLElement)) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextItem = focusAdjacentMenuBarItem(menuBar, directItem, 1);
      if (nextItem && hasOpenRootMenu(menuBar)) {
        if (getPanelForItem(nextItem)) {
          openMenuForItem(nextItem, { focus: false });
        } else {
          closeOpenRootMenus(menuBar);
        }
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const previousItem = focusAdjacentMenuBarItem(menuBar, directItem, -1);
      if (previousItem && hasOpenRootMenu(menuBar)) {
        if (getPanelForItem(previousItem)) {
          openMenuForItem(previousItem, { focus: false });
        } else {
          closeOpenRootMenus(menuBar);
        }
      }
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusMenuBarItem(menuBar, 0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusMenuBarItem(menuBar, getMenuBarItems(menuBar).length - 1);
      return;
    }

    if (event.key === "ArrowDown") {
      if (getPanelForItem(directItem)) {
        event.preventDefault();
        openMenuForItem(directItem, { focus: "first" });
      }
      return;
    }

    if (event.key === "ArrowUp") {
      if (getPanelForItem(directItem)) {
        event.preventDefault();
        openMenuForItem(directItem, { focus: "last" });
      }
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && getPanelForItem(directItem)) {
      event.preventDefault();
      openMenuForItem(directItem, { focus: "first" });
    }
    return;
  }

  const activePanel = target.closest(MENU_PANEL_SELECTOR);
  if (!(activePanel instanceof HTMLElement) || !isRootMenuPanel(activePanel)) {
    return;
  }

  const invoker = getInvokerForPanel(activePanel);
  if (!(invoker instanceof HTMLElement)) {
    return;
  }

  const menuBar = invoker.closest(MENUBAR_SELECTOR);
  if (!(menuBar instanceof HTMLElement)) {
    return;
  }

  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const nextItem = focusAdjacentMenuBarItem(menuBar, invoker, event.key === "ArrowRight" ? 1 : -1);
  if (!nextItem) {
    return;
  }

  if (getPanelForItem(nextItem)) {
    openMenuForItem(nextItem, { focus: "first" });
  } else {
    closeOpenRootMenus(menuBar);
  }
});
