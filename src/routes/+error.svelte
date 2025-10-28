
<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '$lib/components/ui/button/button.svelte';
    import Card from '$lib/components/ui/card/card.svelte';
    import CardContent from '$lib/components/ui/card/card-content.svelte';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  
    export let status: number | null = null; // optional, pass the HTTP status if available
    export let message: string | null = null; // optional custom message
    

  </script>
  
  <section class="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 transition-colors">
    <Card class="mx-4 max-w-2xl w-full rounded-2xl shadow-lg">
      <CardContent class="p-10 md:p-12">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="flex-shrink-0 text-6xl md:text-7xl font-extrabold leading-none text-slate-800 dark:text-slate-100">
            <span class="block">404</span>
          </div>
  
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
            <p class="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300">
              {#if message}
                {@html message}
              {:else}
                The page you are looking for doesn't exist or has been moved.
              {/if}
            </p>
  
            <div class="mt-6 flex flex-wrap gap-3">
              <!-- Back button: adjust href to your router usage (sveltekit uses <a href="/">) -->
              <a href="/dashboard" class="inline-flex">
                <Button class="inline-flex items-center gap-2" variant="outline">
                  <ArrowLeft class="h-4 w-4" />
                  Back to home
                </Button>
              </a>
  
              <a href="/support" class="inline-flex">
                <Button variant="ghost">Contact support</Button>
              </a>
            </div>
  
            {#if status}
              <p class="mt-4 text-xs text-slate-500 dark:text-slate-400">Error code: {status}</p>
            {/if}
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
  
  <style>
    /* Minimal extra styling (use Tailwind for most) */
    :global(.card) { /* if your shadcn Card adds these classes, keep this block empty */ }
  </style>
  