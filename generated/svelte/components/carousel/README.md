# Carousel

Enhances a scroll-snap sequence with previous/next controls, authored dot navigation, and active snap-state sync while keeping the DOM as the source of truth.

## Imports

Default entrypoint with automatic CSS and behavior asset imports:

```svelte
<script lang="ts">
  import { Carousel, CarouselGroup, CarouselItem, CarouselControls, CarouselPrevButton, CarouselNextButton, CarouselDots, CarouselDot } from "@dashbase/svelte/carousel";
</script>
```

Manual entrypoint when you want to control asset loading yourself:

```ts
import { Carousel, CarouselGroup, CarouselItem, CarouselControls, CarouselPrevButton, CarouselNextButton, CarouselDots, CarouselDot, carouselAssets } from "@dashbase/svelte/carousel/manual";
```
