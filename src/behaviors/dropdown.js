/*
 * Dashbase — Dropdown behavior
 *
 * Enhances details.dropdown with:
 * - outside-click dismissal for root menus
 * - Escape to close the active menu layer
 * - Arrow/Home/End keyboard navigation across visible menu entries
 * - submenu flyouts using nested details.dropdown.submenu
 * - checkbox / radio state management through aria-checked
 */

const DROPDOWN_SELECTOR = "details.dropdown"
const ROOT_DROPDOWN_SELECTOR = "details.dropdown:not(.submenu)"
let dropdownPanelCount = 0

function isDropdown(value) {
  return value instanceof HTMLDetailsElement && value.matches(DROPDOWN_SELECTOR)
}

function getDropdownSummary(dropdown) {
  return dropdown.querySelector(":scope > summary")
}

function getDropdownPanel(dropdown) {
  const panel = dropdown.querySelector(":scope > dropdown-panel")
  return panel instanceof HTMLElement ? panel : null
}

function getParentDropdown(dropdown) {
  const parent = dropdown.parentElement?.closest(DROPDOWN_SELECTOR)
  return isDropdown(parent) ? parent : null
}

function getRootDropdown(dropdown) {
  let current = dropdown
  let parent = getParentDropdown(current)

  while (parent) {
    current = parent
    parent = getParentDropdown(current)
  }

  return current
}

function isDisabled(element) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  )
}

function isMenuActionItem(element) {
  return (
    element.matches('button, a') ||
    element.matches('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
  )
}

function isCheckboxItem(element) {
  return element.getAttribute("role") === "menuitemcheckbox"
}

function isRadioItem(element) {
  return element.getAttribute("role") === "menuitemradio"
}

function getSubmenuFromTrigger(element) {
  const parent = element.parentElement
  if (!isDropdown(parent) || !parent.classList.contains("submenu")) {
    return null
  }

  return element === getDropdownSummary(parent) ? parent : null
}

function getMenuEntries(dropdown) {
  const panel = getDropdownPanel(dropdown)
  if (!panel) {
    return []
  }

  return [...panel.children].flatMap((child) => {
    if (!(child instanceof HTMLElement)) {
      return []
    }

    if (isDropdown(child) && child.classList.contains("submenu")) {
      const summary = getDropdownSummary(child)
      return summary && !isDisabled(summary) ? [summary] : []
    }

    if (!isMenuActionItem(child) || isDisabled(child)) {
      return []
    }

    return [child]
  })
}

function getClosestMenuEntry(target) {
  const candidate = target.closest(
    'summary, button, a, [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  )

  if (!(candidate instanceof HTMLElement)) {
    return null
  }

  const submenu = getSubmenuFromTrigger(candidate)
  if (submenu) {
    return candidate
  }

  const panel = candidate.parentElement
  if (!(panel instanceof HTMLElement) || panel.tagName !== "DROPDOWN-PANEL") {
    return null
  }

  return isMenuActionItem(candidate) ? candidate : null
}

function ensurePanelRelationship(dropdown) {
  const summary = getDropdownSummary(dropdown)
  const panel = getDropdownPanel(dropdown)

  if (!(summary instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
    return
  }

  if (!panel.id) {
    dropdownPanelCount += 1
    panel.id = `dashbase-dropdown-panel-${dropdownPanelCount}`
  }

  summary.setAttribute("aria-controls", panel.id)

  if (panel.getAttribute("role") === "menu") {
    summary.setAttribute("aria-haspopup", "menu")
  }

  if (dropdown.classList.contains("submenu") && !summary.hasAttribute("role")) {
    summary.setAttribute("role", "menuitem")
  }
}

function syncDropdownState(dropdown) {
  const summary = getDropdownSummary(dropdown)
  if (!(summary instanceof HTMLElement)) {
    return
  }

  ensurePanelRelationship(dropdown)
  summary.setAttribute("aria-expanded", String(dropdown.open))
}

function closeDescendantDropdowns(dropdown) {
  for (const child of dropdown.querySelectorAll("details.dropdown[open]")) {
    if (isDropdown(child)) {
      child.open = false
      syncDropdownState(child)
    }
  }
}

function closeDropdown(dropdown, { focusSummary = false } = {}) {
  closeDescendantDropdowns(dropdown)

  if (dropdown.open) {
    dropdown.open = false
    syncDropdownState(dropdown)
  }

  if (focusSummary) {
    getDropdownSummary(dropdown)?.focus()
  }
}

function closeOpenRootDropdowns({ except = null } = {}) {
  for (const dropdown of document.querySelectorAll(`${ROOT_DROPDOWN_SELECTOR}[open]`)) {
    if (!isDropdown(dropdown) || dropdown === except) {
      continue
    }

    closeDropdown(dropdown)
  }
}

function closeSiblingSubmenus(dropdown, { except = null } = {}) {
  const panel = getDropdownPanel(dropdown)
  if (!panel) {
    return
  }

  for (const child of panel.children) {
    if (!isDropdown(child) || !child.classList.contains("submenu") || child === except) {
      continue
    }

    closeDropdown(child)
  }
}

function focusDropdownItem(dropdown, index) {
  const entries = getMenuEntries(dropdown)
  if (entries.length === 0) {
    return
  }

  const safeIndex = Math.min(Math.max(index, 0), entries.length - 1)
  const target = entries[safeIndex]
  const submenu = getSubmenuFromTrigger(target)

  closeSiblingSubmenus(dropdown, { except: submenu })
  target.focus()
}

function openDropdown(dropdown) {
  if (!dropdown.open) {
    dropdown.open = true
    syncDropdownState(dropdown)
  }
}

function toggleCheckboxItem(item) {
  const checked = item.getAttribute("aria-checked") === "true"
  item.setAttribute("aria-checked", String(!checked))
}

function selectRadioItem(item) {
  const panel = item.parentElement
  if (!(panel instanceof HTMLElement)) {
    item.setAttribute("aria-checked", "true")
    return
  }

  const groupName = item.getAttribute("name")

  for (const sibling of panel.children) {
    if (!(sibling instanceof HTMLElement) || !isRadioItem(sibling)) {
      continue
    }

    if (groupName && sibling.getAttribute("name") !== groupName) {
      continue
    }

    sibling.setAttribute("aria-checked", String(sibling === item))
  }
}

function initializeDropdown(dropdown) {
  ensurePanelRelationship(dropdown)
  syncDropdownState(dropdown)
}

for (const dropdown of document.querySelectorAll(DROPDOWN_SELECTOR)) {
  if (isDropdown(dropdown)) {
    initializeDropdown(dropdown)
  }
}

document.addEventListener("toggle", (event) => {
  const dropdown = isDropdown(event.target) ? event.target : null
  if (!dropdown) {
    return
  }

  if (dropdown.open) {
    const root = getRootDropdown(dropdown)
    closeOpenRootDropdowns({ except: root })

    if (dropdown.classList.contains("submenu")) {
      const parent = getParentDropdown(dropdown)
      if (parent) {
        closeSiblingSubmenus(parent, { except: dropdown })
      }
    } else {
      closeSiblingSubmenus(dropdown)
    }
  } else {
    closeDescendantDropdowns(dropdown)
  }

  syncDropdownState(dropdown)
})

document.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null
  if (!target) {
    return
  }

  const clickedDropdown = target.closest(DROPDOWN_SELECTOR)
  if (!isDropdown(clickedDropdown)) {
    closeOpenRootDropdowns()
    return
  }

  closeOpenRootDropdowns({ except: getRootDropdown(clickedDropdown) })

  const entry = getClosestMenuEntry(target)
  if (!(entry instanceof HTMLElement) || isDisabled(entry)) {
    return
  }

  if (getSubmenuFromTrigger(entry)) {
    return
  }

  if (isCheckboxItem(entry)) {
    event.preventDefault()
    toggleCheckboxItem(entry)
    return
  }

  if (isRadioItem(entry)) {
    event.preventDefault()
    selectRadioItem(entry)
    return
  }

  closeDropdown(getRootDropdown(clickedDropdown), {
    focusSummary: entry.tagName !== "A",
  })
})

document.addEventListener("keydown", (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null
  if (!target) {
    return
  }

  const activeDropdown = target.closest(DROPDOWN_SELECTOR)
  if (!isDropdown(activeDropdown)) {
    return
  }

  const submenuFromTrigger = getSubmenuFromTrigger(target)
  const navigationDropdown = submenuFromTrigger
    ? getParentDropdown(submenuFromTrigger) ?? submenuFromTrigger
    : activeDropdown

  const activeSummary = getDropdownSummary(activeDropdown)
  const entries = getMenuEntries(navigationDropdown)
  const entryIndex = entries.indexOf(target)

  if (event.key === "Escape") {
    if (activeDropdown.open) {
      event.preventDefault()
      closeDropdown(activeDropdown, { focusSummary: true })
    }
    return
  }

  if (target === activeSummary && !submenuFromTrigger) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      openDropdown(activeDropdown)
      focusDropdownItem(activeDropdown, 0)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      openDropdown(activeDropdown)
      focusDropdownItem(activeDropdown, entries.length - 1)
    }

    return
  }

  if (submenuFromTrigger) {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      openDropdown(submenuFromTrigger)
      focusDropdownItem(submenuFromTrigger, 0)
      return
    }

    if (event.key === "ArrowLeft" && submenuFromTrigger.open) {
      event.preventDefault()
      closeDropdown(submenuFromTrigger, { focusSummary: true })
      return
    }
  }

  if (entryIndex === -1 || entries.length === 0) {
    return
  }

  if (event.key === "Tab") {
    closeDropdown(getRootDropdown(activeDropdown))
    return
  }

  if (event.key === "ArrowLeft") {
    const parent = getParentDropdown(activeDropdown)
    if (parent && activeDropdown.classList.contains("submenu")) {
      event.preventDefault()
      closeDropdown(activeDropdown, { focusSummary: true })
    }
    return
  }

  if (event.key === "ArrowRight") {
    const submenu = getSubmenuFromTrigger(target)
    if (submenu) {
      event.preventDefault()
      openDropdown(submenu)
      focusDropdownItem(submenu, 0)
    }
    return
  }

  let nextIndex = null

  if (event.key === "ArrowDown") {
    nextIndex = (entryIndex + 1) % entries.length
  } else if (event.key === "ArrowUp") {
    nextIndex = (entryIndex - 1 + entries.length) % entries.length
  } else if (event.key === "Home") {
    nextIndex = 0
  } else if (event.key === "End") {
    nextIndex = entries.length - 1
  }

  if (nextIndex == null) {
    return
  }

  event.preventDefault()
  const nextEntry = entries[nextIndex]
  closeSiblingSubmenus(navigationDropdown, { except: getSubmenuFromTrigger(nextEntry) })
  nextEntry.focus()
})
