<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
  const { data } = $props();

  let password = $state('');
  let confirm = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let success = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!data.valid) return;
    error = null;
    success = false;
    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match';
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: data.token, password })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = out.error || 'Reset failed';
        return;
      }
      success = true;
    } finally {
      loading = false;
    }
  }
</script>

<div class="relative flex min-h-screen flex-col items-center justify-center px-4">
  <div class="absolute top-8 flex items-center gap-2">
    <img
      src="https://dcassetcdn.com/design_img/3656568/47349/47349_20884214_3656568_d2aa512e_image.png"
      alt="Logo"
      class="h-10 w-auto drop-shadow-sm"
    />
    <h1 class="text-xl font-semibold text-slate-800 dark:text-slate-200">RoofLink</h1>
  </div>

  <Card class="w-full hover:shadow-2xl max-w-md rounded-2xl border border-purple-100 bg-white/80 shadow-xl backdrop-blur-md dark:border-purple-900 dark:bg-[#1a1335]/80">
    <CardHeader class="pb-2 text-center">
      <h1 class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">Reset password</h1>
      {#if !data.valid}
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">This reset link is invalid or has expired.</p>
      {/if}
    </CardHeader>

    {#if data.valid}
      <CardContent class="pt-6">
        <form onsubmit={submit} class="space-y-5">
          <div class="space-y-2">
            <Label for="password" class="font-medium text-slate-700 dark:text-slate-300">New password</Label>
            <Input id="password" type="password" bind:value={password} required class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="confirm" class="font-medium text-slate-700 dark:text-slate-300">Confirm password</Label>
            <Input id="confirm" type="password" bind:value={confirm} required class="w-full" />
          </div>

          {#if error}
            <div class="rounded-md bg-red-100 p-3 dark:bg-red-900/20">
              <p class="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          {/if}

          {#if success}
            <div class="rounded-md bg-emerald-600/10 p-3 dark:bg-emerald-900/10">
              <p class="text-sm font-medium text-emerald-700 dark:text-emerald-300">Password reset! You can now <a class="underline" href="/login">sign in</a>.</p>
            </div>
          {/if}

          <Button
            type="submit"
            class="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-medium text-white shadow-md transition-all duration-300 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800"
            variant="default"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </CardContent>
    {:else}
      <CardContent class="pt-6">
        <div class="space-y-4">
          <a href="/forgot" class="text-purple-600 dark:text-purple-400 underline">Request a new reset link</a>
        </div>
      </CardContent>
    {/if}

    <CardFooter class="flex flex-col space-y-3 border-t border-purple-100 p-6 dark:border-purple-900">
      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        <a href="/login" class="font-medium text-purple-600 hover:underline dark:text-purple-400">Back to sign in</a>
      </p>
    </CardFooter>
  </Card>
</div>


