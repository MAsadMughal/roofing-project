<script lang="ts" module>
  import type { Snippet } from "svelte";
  export type SelectRootProps = {
    type?: "single" | "multiple";
    name?: string;
    children?: Snippet;
    value?: string;
  };
</script>

<script lang="ts">
  import { setContext } from "svelte";
  let { type = "single", name, value = $bindable<string>("") , children }: SelectRootProps = $props();

  let open = $state(false);
  function toggleOpen() { open = !open; }
  function close() { open = false; }
  function setValue(v: string) { value = v; close(); }

  setContext("select-ctx", {
    type,
    name,
    get open() { return open; },
    toggleOpen,
    close,
    get value() { return value; },
    setValue,
  });
</script>

<div>
  {@render children?.()}
  
</div>


