/*
 * Dashbase — Carousel behavior
 *
 * Enhances <ui-carousel> roots with:
 * - previous / next button controls
 * - authored dot navigation
 * - active snap-position and control-state sync
 */

const CAROUSEL_ROOT_SELECTOR = "ui-carousel";
const CAROUSEL_GROUP_SELECTOR = "item-group";

function isCarouselRoot(value) {
  return value instanceof HTMLElement && value.matches(CAROUSEL_ROOT_SELECTOR);
}

function getCarouselParts(root) {
  const group = root.querySelector(`:scope > ${CAROUSEL_GROUP_SELECTOR}`);
  if (!(group instanceof HTMLElement)) {
    return null;
  }

  const slides = [...group.children].filter((slide) => slide instanceof HTMLElement);
  if (slides.length === 0) {
    return null;
  }

  const dots = root.querySelector(":scope > control-bar > carousel-dots");
  const dotButtons = dots instanceof HTMLElement
    ? [...dots.querySelectorAll(":scope > button")].filter((button) => button instanceof HTMLButtonElement)
    : [];

  return {
    group,
    slides,
    prev: root.querySelector(":scope > control-bar [data-carousel-prev]"),
    next: root.querySelector(":scope > control-bar [data-carousel-next]"),
    dotButtons,
  };
}

function getCarouselAxis(root) {
  return root.classList.contains("vertical")
    ? {
      delta: "top",
      scroll: "scrollTop",
      scrollSize: "scrollHeight",
      clientSize: "clientHeight",
    }
    : {
      delta: "left",
      scroll: "scrollLeft",
      scrollSize: "scrollWidth",
      clientSize: "clientWidth",
    };
}

function getSnapState(root, parts) {
  const axis = getCarouselAxis(root);
  const currentOffset = parts.group[axis.scroll];
  const groupRect = parts.group.getBoundingClientRect();
  const maxScroll = Math.max(0, parts.group[axis.scrollSize] - parts.group[axis.clientSize]);
  const rawPositions = parts.slides.map((slide, index) => {
    const slideRect = slide.getBoundingClientRect();
    const rawPosition = currentOffset + (slideRect[axis.delta] - groupRect[axis.delta]);
    return {
      position: Math.min(maxScroll, Math.max(0, rawPosition)),
      slideIndex: index,
    };
  });

  const snapPoints = [];
  for (const point of rawPositions) {
    const previous = snapPoints[snapPoints.length - 1];
    if (!previous || Math.abs(previous.position - point.position) > 1) {
      snapPoints.push(point);
    }
  }

  return {
    axis,
    snapPoints,
  };
}

function getNearestSnapIndex(track, snapState) {
  const currentOffset = track[snapState.axis.scroll];
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  snapState.snapPoints.forEach((point, index) => {
    const distance = Math.abs(point.position - currentOffset);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function syncCarousel(parts, snapState, activeIndex) {
  const activeSlideIndex = snapState.snapPoints[activeIndex]?.slideIndex ?? 0;

  parts.slides.forEach((slide, index) => {
    slide.toggleAttribute("data-active", index === activeSlideIndex);
  });

  parts.dotButtons.forEach((button, index) => {
    const isVisible = index < snapState.snapPoints.length;
    button.hidden = !isVisible;

    if (isVisible && index === activeIndex) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (parts.prev instanceof HTMLButtonElement) {
    parts.prev.disabled = activeIndex === 0;
  }

  if (parts.next instanceof HTMLButtonElement) {
    parts.next.disabled = activeIndex === snapState.snapPoints.length - 1;
  }
}

function scrollToSnap(parts, snapState, index) {
  const point = snapState.snapPoints[index];
  if (!point) {
    return;
  }

  parts.group.scrollTo({
    [snapState.axis.delta]: point.position,
  });
}

function moveCarousel(parts, snapState, activeIndex, direction) {
  const nextIndex = Math.max(0, Math.min(snapState.snapPoints.length - 1, activeIndex + direction));

  syncCarousel(parts, snapState, nextIndex);
  scrollToSnap(parts, snapState, nextIndex);
  return nextIndex;
}

function initializeCarousel(root) {
  if (root.dataset.carouselInitialized === "true") {
    return;
  }

  const parts = getCarouselParts(root);
  if (!parts) {
    return;
  }

  root.dataset.carouselInitialized = "true";
  let snapState = getSnapState(root, parts);
  let activeIndex = getNearestSnapIndex(parts.group, snapState);
  let pendingIndex = null;
  let settleTimer = 0;

  syncCarousel(parts, snapState, activeIndex);

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.closest("[data-carousel-prev]")) {
      event.preventDefault();
      pendingIndex = moveCarousel(parts, snapState, activeIndex, -1);
      activeIndex = pendingIndex;
      return;
    }

    if (target.closest("[data-carousel-next]")) {
      event.preventDefault();
      pendingIndex = moveCarousel(parts, snapState, activeIndex, 1);
      activeIndex = pendingIndex;
      return;
    }

    const dotIndex = parts.dotButtons.findIndex((button) => button === target.closest("button"));
    if (dotIndex < 0 || dotIndex >= snapState.snapPoints.length) {
      return;
    }

    event.preventDefault();
    pendingIndex = dotIndex;
    activeIndex = dotIndex;
    syncCarousel(parts, snapState, activeIndex);
    scrollToSnap(parts, snapState, activeIndex);
  });

  root.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || !root.contains(target)) {
      return;
    }

    if (
      target.matches('input, textarea, select, [contenteditable="true"]') ||
      target.isContentEditable
    ) {
      return;
    }

    const vertical = root.classList.contains("vertical");

    switch (event.key) {
      case vertical ? "ArrowUp" : "ArrowLeft":
        event.preventDefault();
        pendingIndex = moveCarousel(parts, snapState, activeIndex, -1);
        activeIndex = pendingIndex;
        break;
      case vertical ? "ArrowDown" : "ArrowRight":
        event.preventDefault();
        pendingIndex = moveCarousel(parts, snapState, activeIndex, 1);
        activeIndex = pendingIndex;
        break;
      case "Home":
        event.preventDefault();
        activeIndex = 0;
        pendingIndex = activeIndex;
        syncCarousel(parts, snapState, activeIndex);
        scrollToSnap(parts, snapState, activeIndex);
        break;
      case "End":
        event.preventDefault();
        activeIndex = snapState.snapPoints.length - 1;
        pendingIndex = activeIndex;
        syncCarousel(parts, snapState, activeIndex);
        scrollToSnap(parts, snapState, activeIndex);
        break;
      default:
        break;
    }
  });

  function syncAfterScrollSettles() {
    snapState = getSnapState(root, parts);
    const settledIndex = getNearestSnapIndex(parts.group, snapState);
    pendingIndex = null;
    activeIndex = settledIndex;
    syncCarousel(parts, snapState, activeIndex);
  }

  parts.group.addEventListener("scroll", () => {
    if (settleTimer) {
      window.clearTimeout(settleTimer);
    }

    if (pendingIndex !== null) {
      activeIndex = pendingIndex;
      syncCarousel(parts, snapState, activeIndex);
    }

    settleTimer = window.setTimeout(() => {
      syncAfterScrollSettles();
    }, 120);
  }, { passive: true });

  const resizeObserver = new ResizeObserver(() => {
    syncAfterScrollSettles();
  });
  resizeObserver.observe(parts.group);
}

for (const root of document.querySelectorAll(CAROUSEL_ROOT_SELECTOR)) {
  if (isCarouselRoot(root)) {
    initializeCarousel(root);
  }
}
