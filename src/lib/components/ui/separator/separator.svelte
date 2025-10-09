<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type SeparatorProps = { orientation?: 'horizontal' | 'vertical'; class?: string };
</script>

<script lang="ts">
  let { orientation = 'horizontal', class: className }: SeparatorProps = $props();
</script>

<div
  role="separator"
  aria-orientation={orientation}
  class={cn(
    orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full',
    'bg-border',
    className
  )}
></div>


