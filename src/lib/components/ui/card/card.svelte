<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type CardProps = { class?: string; children?: any };
</script>

<script lang="ts">
  let { class: className, children }: CardProps = $props();
</script>

<div class={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
  {@render children?.()}
</div>


