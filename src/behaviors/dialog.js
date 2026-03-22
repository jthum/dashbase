/*
 * Dashbase — Dialog behavior shim
 *
 * Bridges invoketarget / invokeaction attributes in browsers that do not
 * support those commands natively. Native <dialog> semantics still do the
 * heavy lifting; this only wires open/close actions to existing elements.
 */

function resolveDialogTarget(invoker) {
  const targetId = invoker.getAttribute("invoketarget");
  if (!targetId) {
    return null;
  }

  const root = invoker.getRootNode?.();
  if (root && "getElementById" in root && typeof root.getElementById === "function") {
    return root.getElementById(targetId);
  }

  return document.getElementById(targetId);
}

function invokeDialogAction(target, action) {
  if (!(target instanceof HTMLDialogElement)) {
    return;
  }

  switch (action) {
    case "close":
      if (target.open) {
        target.close();
      } else if (target.matches(":popover-open")) {
        target.hidePopover();
      }
      break;
    case "show":
      if ("show" in target && typeof target.show === "function" && !target.open) {
        target.show();
      }
      break;
    case "showModal":
    default:
      if (!target.open) {
        target.showModal();
      }
      break;
  }
}

document.addEventListener("click", (event) => {
  const invoker = event.target instanceof Element
    ? event.target.closest("[invoketarget]")
    : null;

  if (!(invoker instanceof HTMLElement)) {
    return;
  }

  const target = resolveDialogTarget(invoker);
  if (!(target instanceof HTMLDialogElement)) {
    return;
  }

  const action = invoker.getAttribute("invokeaction") ?? "showModal";
  event.preventDefault();
  invokeDialogAction(target, action);
});
