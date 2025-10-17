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
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: data.token, password })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = out.error || 'Failed to accept invite';
        return;
      }
      success = true;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center">
  <Card class="w-full max-w-lg border shadow-lg">
    <CardHeader>
      <div class="space-y-2 text-center">
        <h1 class="text-3xl font-bold tracking-tight">Create your password</h1>
        {#if !data.valid}
          <p class="text-sm text-destructive">This invite link is invalid or has expired.</p>
        {/if}
        {#if data.valid}
          <p class="text-sm text-muted-foreground">{data.email}</p>
        {/if}
      </div>
    </CardHeader>

    {#if data.valid}
      <CardContent>
        <form onsubmit={submit} class="space-y-4">
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input id="password" type="password" bind:value={password} required minlength={8} />
          </div>
          <div class="space-y-2">
            <Label for="confirm">Confirm password</Label>
            <Input id="confirm" type="password" bind:value={confirm} required minlength={8} />
          </div>

          {#if error}
            <div class="rounded-md bg-destructive/10 p-3">
              <p class="text-sm font-medium text-destructive">{error}</p>
            </div>
          {/if}

          {#if success}
            <div class="rounded-md bg-emerald-600/10 p-3">
              <p class="text-sm font-medium text-emerald-700">Invite accepted. You can now sign in.</p>
            </div>
          {/if}

          <Button type="submit" class="w-full" variant="default" size="lg" disabled={loading}>
            {loading ? 'Saving…' : 'Set password'}
          </Button>
        </form>
      </CardContent>
    {/if}

    <CardFooter class="flex flex-col space-y-4 border-t p-6">
      <p class="text-center text-sm text-muted-foreground">
        Already have an account?
        <a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
      </p>
    </CardFooter>
  </Card>
</div>


