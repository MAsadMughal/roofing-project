<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  import type { HTMLLabelAttributes } from "svelte/elements";
  export type LabelProps = HTMLLabelAttributes & { class?: string };
</script>

<script lang="ts">
  let { class: className, children, ...rest }: LabelProps = $props();
</script>

<label class={cn("text-sm font-medium leading-none", className)} {...rest}>
  {@render children?.()}
</label>


