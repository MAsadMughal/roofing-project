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
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data.error || 'Login failed';
        return;
      }
      await goto('/');
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen grid place-items-center bg-background px-4">
  <Card class="w-full max-w-sm p-6 sm:p-8">
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p class="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <form on:submit|preventDefault={submit} class="space-y-4">
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} required />
        </div>
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <Input id="password" type="password" bind:value={password} required />
        </div>
        {#if error}
          <p class="text-destructive text-sm">{error}</p>
        {/if}
        <Button type="submit" class="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>

      <p class="text-sm text-center text-muted-foreground">
        No account? <a href="/signup" class="text-primary underline underline-offset-4">Sign up</a>
      </p>
      <noscript><p>Please enable JavaScript to login.</p></noscript>
    </div>
  </Card>
</div>


