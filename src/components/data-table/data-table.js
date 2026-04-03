/*
 * Dashbase — Data Table behavior
 *
 * Enhances <data-table> roots with:
 * - client-side filtering through a search input
 * - sortable columns via header buttons
 * - optional row selection and visible-row select-all
 * - result counts and empty-state coordination
 */

const DATA_TABLE_ROOT_SELECTOR = "data-table";
const DATA_TABLE_FILTER_SELECTOR = "[data-table-filter]";
const DATA_TABLE_SORT_SELECTOR = "[data-table-sort]";
const DATA_TABLE_SELECT_ALL_SELECTOR = "[data-table-select-all]";
const DATA_TABLE_ROW_SELECT_SELECTOR = "[data-table-row-select]";
const DATA_TABLE_SELECTION_COUNT_SELECTOR = "[data-table-selection-count]";
const DATA_TABLE_RESULT_COUNT_SELECTOR = "[data-table-result-count]";
const DATA_TABLE_EMPTY_SELECTOR = "table-empty";

function isDataTableRoot(value) {
  return value instanceof HTMLElement && value.matches(DATA_TABLE_ROOT_SELECTOR);
}

function getDataTableTable(root) {
  const nested = root.querySelector(":scope > scroll-area > table");
  if (nested instanceof HTMLTableElement) {
    return nested;
  }

  const direct = root.querySelector(":scope > table");
  return direct instanceof HTMLTableElement ? direct : null;
}

function getDataTableBody(root) {
  const table = getDataTableTable(root);
  return table?.tBodies?.[0] ?? null;
}

function getDataTableRows(root) {
  const body = getDataTableBody(root);
  return body ? [...body.rows] : [];
}

function getFilterInput(root) {
  const input = root.querySelector(DATA_TABLE_FILTER_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function getSelectionCountElement(root) {
  const element = root.querySelector(DATA_TABLE_SELECTION_COUNT_SELECTOR);
  return element instanceof HTMLElement ? element : null;
}

function getResultCountElement(root) {
  const element = root.querySelector(DATA_TABLE_RESULT_COUNT_SELECTOR);
  return element instanceof HTMLElement ? element : null;
}

function getEmptyElement(root) {
  const element = root.querySelector(`:scope > ${DATA_TABLE_EMPTY_SELECTOR}`);
  return element instanceof HTMLElement ? element : null;
}

function getSelectAllInput(root) {
  const input = root.querySelector(DATA_TABLE_SELECT_ALL_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function getRowSelectionInput(row) {
  const input = row.querySelector(DATA_TABLE_ROW_SELECT_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function getSortHeaders(root) {
  return [...root.querySelectorAll("th")].filter((cell) => cell instanceof HTMLTableCellElement);
}

function getSortButtonCell(button) {
  const cell = button.closest("th, td");
  return cell instanceof HTMLTableCellElement ? cell : null;
}

function getColumnIndex(cell) {
  const row = cell.parentElement;
  if (!(row instanceof HTMLTableRowElement)) {
    return -1;
  }

  return [...row.cells].indexOf(cell);
}

function getCellForColumn(row, columnIndex) {
  if (columnIndex < 0 || columnIndex >= row.cells.length) {
    return null;
  }

  const cell = row.cells.item(columnIndex);
  return cell instanceof HTMLTableCellElement ? cell : null;
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getRowSearchValue(row) {
  return normalizeText(row.dataset.search ?? row.textContent ?? "");
}

function getRowOriginalIndex(row) {
  if (!row.dataset.originalIndex) {
    row.dataset.originalIndex = String(row.sectionRowIndex);
  }

  return Number(row.dataset.originalIndex);
}

function getSortValue(row, columnIndex) {
  const cell = getCellForColumn(row, columnIndex);
  if (!cell) {
    return "";
  }

  return (cell.getAttribute("data-sort-value") ?? cell.textContent ?? "").trim();
}

function compareSortValues(left, right, type) {
  if (type === "number") {
    const leftNumber = Number(left.replace(/[^0-9.+-]/g, ""));
    const rightNumber = Number(right.replace(/[^0-9.+-]/g, ""));

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
  }

  if (type === "date") {
    const leftDate = Date.parse(left);
    const rightDate = Date.parse(right);

    if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
      return leftDate - rightDate;
    }
  }

  return left.localeCompare(right, undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function setRowSelectedState(row) {
  const input = getRowSelectionInput(row);
  row.toggleAttribute("data-selected", input?.checked ?? false);
}

function syncAllRowSelectedStates(root) {
  for (const row of getDataTableRows(root)) {
    setRowSelectedState(row);
  }
}

function updateSelectionSummary(root) {
  const rows = getDataTableRows(root);
  const visibleRows = rows.filter((row) => !row.hidden);
  const selectionElement = getSelectionCountElement(root);
  const resultElement = getResultCountElement(root);
  const selectAll = getSelectAllInput(root);

  const totalSelected = rows.filter((row) => getRowSelectionInput(row)?.checked).length;
  const visibleSelectableRows = visibleRows.filter((row) => getRowSelectionInput(row));
  const visibleSelected = visibleSelectableRows.filter((row) => getRowSelectionInput(row)?.checked).length;

  if (selectionElement) {
    selectionElement.textContent = `${totalSelected} selected`;
  }

  if (resultElement) {
    resultElement.textContent = `${visibleRows.length} visible of ${rows.length}`;
  }

  if (selectAll) {
    selectAll.checked = visibleSelectableRows.length > 0 && visibleSelected === visibleSelectableRows.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleSelectableRows.length;
    selectAll.disabled = visibleSelectableRows.length === 0;
  }
}

function updateEmptyState(root, query, visibleCount) {
  const empty = getEmptyElement(root);
  if (!empty) {
    return;
  }

  if (!empty.dataset.defaultLabel) {
    empty.dataset.defaultLabel = empty.textContent?.trim() || "No rows available.";
  }

  empty.hidden = visibleCount > 0;
  if (visibleCount > 0) {
    return;
  }

  empty.textContent = query
    ? `No rows match "${query}".`
    : empty.dataset.defaultLabel;
}

function applyDataTable(root) {
  const body = getDataTableBody(root);
  if (!body) {
    return;
  }

  const filterInput = getFilterInput(root);
  const rows = getDataTableRows(root);
  const query = normalizeText(filterInput?.value ?? "");
  const sortIndex = Number(root.dataset.sortIndex ?? "-1");
  const sortDirection = root.dataset.sortDirection === "descending" ? "descending" : "ascending";
  const sortType = root.dataset.sortType ?? "text";

  const sortedRows = [...rows].sort((left, right) => {
    if (sortIndex < 0) {
      return getRowOriginalIndex(left) - getRowOriginalIndex(right);
    }

    const leftValue = getSortValue(left, sortIndex);
    const rightValue = getSortValue(right, sortIndex);
    const comparison = compareSortValues(leftValue, rightValue, sortType);
    if (comparison !== 0) {
      return sortDirection === "ascending" ? comparison : -comparison;
    }

    return getRowOriginalIndex(left) - getRowOriginalIndex(right);
  });

  for (const row of sortedRows) {
    body.append(row);
    const matches = !query || getRowSearchValue(row).includes(query);
    row.hidden = !matches;
    setRowSelectedState(row);
  }

  const visibleCount = sortedRows.filter((row) => !row.hidden).length;
  updateEmptyState(root, filterInput?.value.trim() ?? "", visibleCount);
  updateSelectionSummary(root);
}

function syncSortHeaders(root) {
  const sortIndex = Number(root.dataset.sortIndex ?? "-1");
  const sortDirection = root.dataset.sortDirection === "descending" ? "descending" : "ascending";

  for (const cell of getSortHeaders(root)) {
    if (!cell.querySelector(DATA_TABLE_SORT_SELECTOR)) {
      continue;
    }

    const columnIndex = getColumnIndex(cell);
    if (columnIndex === sortIndex) {
      cell.setAttribute("aria-sort", sortDirection);
    } else {
      cell.removeAttribute("aria-sort");
    }
  }
}

function setSortState(root, button) {
  const cell = getSortButtonCell(button);
  if (!cell) {
    return;
  }

  const columnIndex = getColumnIndex(cell);
  if (columnIndex < 0) {
    return;
  }

  const sameColumn = root.dataset.sortIndex === String(columnIndex);
  const nextDirection = sameColumn && root.dataset.sortDirection === "ascending"
    ? "descending"
    : "ascending";

  root.dataset.sortIndex = String(columnIndex);
  root.dataset.sortDirection = nextDirection;
  root.dataset.sortType = button.getAttribute("data-sort-type") ?? "text";

  syncSortHeaders(root);
  applyDataTable(root);
}

function toggleVisibleRows(root, checked) {
  for (const row of getDataTableRows(root)) {
    if (row.hidden) {
      continue;
    }

    const input = getRowSelectionInput(row);
    if (!input || input.disabled) {
      continue;
    }

    input.checked = checked;
    setRowSelectedState(row);
  }

  updateSelectionSummary(root);
}

function initializeDataTable(root) {
  if (root.dataset.dataTableInitialized === "true") {
    return;
  }

  const table = getDataTableTable(root);
  const body = getDataTableBody(root);
  if (!table || !body) {
    return;
  }

  root.dataset.dataTableInitialized = "true";

  for (const row of getDataTableRows(root)) {
    getRowOriginalIndex(row);
    setRowSelectedState(row);
  }

  const filterInput = getFilterInput(root);
  filterInput?.addEventListener("input", () => {
    applyDataTable(root);
  });

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(DATA_TABLE_SORT_SELECTOR) : null;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    setSortState(root, target);
  });

  const selectAll = getSelectAllInput(root);
  selectAll?.addEventListener("change", () => {
    toggleVisibleRows(root, selectAll.checked);
  });

  root.addEventListener("change", (event) => {
    const target = event.target instanceof Element ? event.target.closest(DATA_TABLE_ROW_SELECT_SELECTOR) : null;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const row = target.closest("tr");
    if (row instanceof HTMLTableRowElement) {
      setRowSelectedState(row);
    }

    updateSelectionSummary(root);
  });

  syncSortHeaders(root);
  applyDataTable(root);
}

for (const root of document.querySelectorAll(DATA_TABLE_ROOT_SELECTOR)) {
  if (isDataTableRoot(root)) {
    initializeDataTable(root);
  }
}
