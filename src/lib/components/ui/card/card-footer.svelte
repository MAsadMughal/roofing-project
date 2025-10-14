<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type CardFooterProps = { class?: string; children?: any };
</script>

<script lang="ts">
  let { class: className, children }: CardFooterProps = $props();
</script>

<div class={cn("p-6 pt-0", className)}>
  {@render children?.()}
</div>



