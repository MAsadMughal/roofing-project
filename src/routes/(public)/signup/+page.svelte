<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';

  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    loading = true;
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, firstName, lastName}) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data.error || 'Signup failed';
        return;
      }
      window.location.href = '/';
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center">
  <Card class="w-full max-w-lg border shadow-lg">
    <CardHeader>
      <div class="space-y-2 text-center">
        <h1 class="text-3xl font-bold tracking-tight">Create Account</h1>
        <p class="text-sm text-muted-foreground">Enter your information to get started with our roofing project management system</p>
      </div>
    </CardHeader>

    <CardContent>
      <form onsubmit={submit} class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="firstName" class="font-medium">First name</Label>
            <Input id="firstName" bind:value={firstName} placeholder="John" class="w-full" />
          </div>
          <div class="space-y-2">
            <Label for="lastName" class="font-medium">Last name</Label>
            <Input id="lastName" bind:value={lastName} placeholder="Doe" class="w-full" />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="email" class="font-medium">Email address</Label>
          <Input id="email" type="email" bind:value={email} placeholder="john@example.com" required class="w-full" />
        </div>

        <div class="space-y-2">
          <Label for="password" class="font-medium">Create password</Label>
          <Input id="password" type="password" bind:value={password} required class="w-full" />
        </div>

        {#if error}
          <div class="rounded-md bg-destructive/15 p-3">
            <p class="text-sm font-medium text-destructive">{error}</p>
          </div>
        {/if}

        <Button type="submit" class="w-full" variant="default" size="lg" disabled={loading}>
          {loading ? 'Creating your account...' : 'Create account'}
        </Button>
      </form>
    </CardContent>

    <CardFooter class="flex flex-col space-y-4 border-t p-6">
      <p class="text-center text-sm text-muted-foreground">
        Already have an account? 
        <a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
      </p>
      <noscript>
        <p class="text-sm text-destructive">Please enable JavaScript to sign up.</p>
      </noscript>
    </CardFooter>
  </Card>
</div>
