<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';

  let email = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let devResetUrl = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    message = null;
    devResetUrl = null;
    loading = true;
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error = data.error || 'Failed to request password reset';
        return;
      }
      message = data.message || 'If that email exists, a reset link has been sent.';
      if (data.resetUrl) devResetUrl = data.resetUrl;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center">
  <Card class="w-full max-w-lg border shadow-lg">
    <CardHeader>
      <div class="space-y-2 text-center">
        <h1 class="text-3xl font-bold tracking-tight">Forgot password</h1>
        <p class="text-sm text-muted-foreground">Enter your email to receive a password reset link.</p>
      </div>
    </CardHeader>

    <CardContent>
      <form onsubmit={submit} class="space-y-6">
        <div class="space-y-2">
          <Label for="email" class="font-medium">Email address</Label>
          <Input id="email" type="email" bind:value={email} required class="w-full" />
        </div>

        {#if error}
          <div class="rounded-md bg-destructive/15 p-3">
            <p class="text-sm font-medium text-destructive">{error}</p>
          </div>
        {/if}

        {#if message}
          <div class="rounded-md bg-emerald-600/10 p-3">
            <p class="text-sm font-medium text-emerald-700">{message}</p>
          </div>
        {/if}

        {#if devResetUrl}
          <div class="text-xs text-muted-foreground">
            Dev reset link: <a class="text-primary underline" href={devResetUrl}>{devResetUrl}</a>
          </div>
        {/if}

        <Button type="submit" class="w-full" variant="default" size="lg" disabled={loading}>
          {loading ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>
    </CardContent>

    <CardFooter class="flex flex-col space-y-4 border-t p-6">
      <p class="text-center text-sm text-muted-foreground">
        Remembered your password?
        <a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
      </p>
    </CardFooter>
  </Card>
</div>


