/*
 * Dashbase — Tabs behavior shim
 *
 * Manages selected state, roving focus, and panel visibility for <tab-list>
 * and <tab-panel>.
 */

const TABS_SELECTOR = "tab-list";
let tabCount = 0;

function nextTabId() {
  tabCount += 1;
  return `db-tab-${tabCount}`;
}

function getTabLists(root = document) {
  const tabLists = [];

  if (root instanceof Element && root.matches(TABS_SELECTOR)) {
    tabLists.push(root);
  }

  if ("querySelectorAll" in root && typeof root.querySelectorAll === "function") {
    tabLists.push(...root.querySelectorAll(TABS_SELECTOR));
  }

  return tabLists;
}

function getTabs(tabList) {
  return [...tabList.querySelectorAll('[role="tab"]')];
}

function getPanel(tab) {
  const panelId = tab.getAttribute("aria-controls");
  if (!panelId) {
    return null;
  }

  return document.getElementById(panelId);
}

function syncTabIdentity(tab, panel) {
  if (!tab.id) {
    tab.id = nextTabId();
  }

  if (panel && !panel.getAttribute("aria-labelledby")) {
    panel.setAttribute("aria-labelledby", tab.id);
  }

  if (panel && !panel.getAttribute("role")) {
    panel.setAttribute("role", "tabpanel");
  }
}

function activateTab(tabList, nextTab, { focus = false } = {}) {
  const tabs = getTabs(tabList);

  for (const tab of tabs) {
    const selected = tab === nextTab;
    const panel = getPanel(tab);

    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;

    if (panel) {
      panel.hidden = !selected;
    }
  }

  if (focus) {
    nextTab.focus();
  }
}

function getInitialTab(tabList) {
  const tabs = getTabs(tabList);
  return tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0] ?? null;
}

function focusAdjacentTab(tabList, currentTab, direction) {
  const tabs = getTabs(tabList);
  const currentIndex = tabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
  activateTab(tabList, tabs[nextIndex], { focus: true });
}

function initTabList(tabList) {
  if (!(tabList instanceof HTMLElement) || tabList.dataset.tabsInitialized === "true") {
    return;
  }

  if (!tabList.getAttribute("role")) {
    tabList.setAttribute("role", "tablist");
  }

  const tabs = getTabs(tabList);
  for (const tab of tabs) {
    const panel = getPanel(tab);
    syncTabIdentity(tab, panel);
  }

  const initialTab = getInitialTab(tabList);
  if (initialTab) {
    activateTab(tabList, initialTab);
  }

  tabList.addEventListener("click", (event) => {
    const tab = event.target instanceof Element
      ? event.target.closest('[role="tab"]')
      : null;

    if (!(tab instanceof HTMLElement) || !tabList.contains(tab)) {
      return;
    }

    activateTab(tabList, tab, { focus: true });
  });

  tabList.addEventListener("keydown", (event) => {
    const currentTab = event.target instanceof Element
      ? event.target.closest('[role="tab"]')
      : null;

    if (!(currentTab instanceof HTMLElement) || !tabList.contains(currentTab)) {
      return;
    }

    const vertical = tabList.getAttribute("aria-orientation") === "vertical";

    switch (event.key) {
      case "ArrowRight":
        if (!vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, 1);
        }
        break;
      case "ArrowLeft":
        if (!vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, -1);
        }
        break;
      case "ArrowDown":
        if (vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, 1);
        }
        break;
      case "ArrowUp":
        if (vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, -1);
        }
        break;
      case "Home": {
        const tabs = getTabs(tabList);
        if (tabs[0]) {
          event.preventDefault();
          activateTab(tabList, tabs[0], { focus: true });
        }
        break;
      }
      case "End": {
        const tabs = getTabs(tabList);
        const lastTab = tabs.at(-1);
        if (lastTab) {
          event.preventDefault();
          activateTab(tabList, lastTab, { focus: true });
        }
        break;
      }
      default:
        break;
    }
  });

  tabList.dataset.tabsInitialized = "true";
}

function initTabs(root = document) {
  getTabLists(root).forEach(initTabList);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initTabs(), { once: true });
} else {
  initTabs();
}

window.Dashbase ??= {};
window.Dashbase.initTabs = initTabs;
