<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type CardContentProps = { class?: string; children?: any };
</script>

<script lang="ts">
  let { class: className, children }: CardContentProps = $props();
</script>

<div class={cn("p-6 pt-0", className)}>
  {@render children?.()}
</div>



