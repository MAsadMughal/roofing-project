<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error: string | null = null;
  let loading = false;

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    loading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data.error || 'Login failed';
        return;
      }
      await goto('/dashboard', { invalidateAll: true });
    } finally {
      loading = false;
    }
  }
</script>

<!-- Page -->
<div class="relative flex min-h-screen flex-col items-center justify-center px-4">
  
  <!-- Branding Top -->
  <div class="absolute top-8 flex items-center gap-2">
    <img
      src="https://dcassetcdn.com/design_img/3656568/47349/47349_20884214_3656568_d2aa512e_image.png"
      alt="Logo"
      class="h-10 w-auto drop-shadow-sm"
    />
    <h1 class="text-xl font-semibold text-slate-800">RoofLink</h1>
  </div>

  <!-- Login Card -->
  <Card class="relative w-full max-w-sm p-8 shadow-xl border border-slate-200/70 rounded-2xl bg-white/90 backdrop-blur-md transition-all hover:shadow-2xl">
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p class="text-sm text-slate-500">Sign in to manage your projects and community</p>
      </div>

      <form on:submit|preventDefault={submit} class="space-y-4">
        <div class="space-y-2">
          <Label for="email" class="text-slate-700">Email</Label>
          <Input id="email" type="email" bind:value={email} required class="focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div class="space-y-2">
          <Label for="password" class="text-slate-700">Password</Label>
          <Input id="password" type="password" bind:value={password} required class="focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        {#if error}
          <p class="text-red-500 text-sm font-medium text-center">{error}</p>
        {/if}

        <Button type="submit" class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p class="text-sm text-center text-slate-500">
        No account?
        <a href="/signup" class="font-medium text-indigo-600 hover:text-violet-600 transition-colors">
          Sign up
        </a>
      </p>
    </div>
  </Card>

  <footer class="absolute bottom-6 text-xs text-slate-400">
    © {new Date().getFullYear()} RoofLink. All rights reserved.
  </footer>
</div>
