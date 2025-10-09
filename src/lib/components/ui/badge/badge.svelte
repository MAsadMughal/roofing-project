<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";
  export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement>> & { class?: string };
</script>

<script lang="ts">
  let { class: className, children, ref = $bindable(null), ...rest }: BadgeProps = $props();
</script>

<span bind:this={ref} class={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold", className)} {...rest}>
  {@render children?.()}
</span>


