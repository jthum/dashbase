# Carousel

Enhances a scroll-snap sequence with previous/next controls, authored dot navigation, and active snap-state sync while keeping the DOM as the source of truth.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```tsx
import { Carousel, CarouselGroup, CarouselItem, CarouselControls, CarouselPrevButton, CarouselNextButton, CarouselDots, CarouselDot } from "@dashbase/react/carousel";
```

Manual entrypoint when you want to control asset loading yourself:

```tsx
import { Carousel, CarouselGroup, CarouselItem, CarouselControls, CarouselPrevButton, CarouselNextButton, CarouselDots, CarouselDot, carouselAssets } from "@dashbase/react/carousel/manual";
```

## Behavior Hosting

- Generated adapter mode: `browser-shim`
- The default entrypoint auto-imports a browser behavior shim.
- In SSR frameworks, mount this component from a client boundary or after client hydration.
- The shim mutates live DOM state. If a framework starts fighting those mutations, prefer a controller-backed or native override.

## Anatomy

- `Carousel` renders `<ui-carousel>`
- `CarouselGroup` renders `<item-group>`
- `CarouselItem` renders `<ui-item>`
- `CarouselControls` renders `<control-bar>`
- `CarouselPrevButton` renders `<button>`
- `CarouselNextButton` renders `<button>`
- `CarouselDots` renders `<carousel-dots>`
- `CarouselDot` renders `<button>`

## Assets

- CSS: `dist/components/carousel/carousel.css`
- JS: `dist/components/carousel/carousel.js`

## Variants

- `vertical` adds `.vertical` on `root`

## State Surface

- `data-active` on `item`
- `aria-current` on `dot` ("true")