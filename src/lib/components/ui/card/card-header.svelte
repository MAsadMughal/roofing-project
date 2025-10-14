<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type CardHeaderProps = { class?: string; children?: any };
</script>

<script lang="ts">
  let { class: className, children }: CardHeaderProps = $props();
</script>

<div class={cn("p-6", className)}>
  {@render children?.()}
</div>



