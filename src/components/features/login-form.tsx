'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const { data, error: authError } = await authClient.signIn.username({
      username,
      password,
    });

    if (authError) {
      setError(authError.message || 'Invalid username or password');
      setIsLoading(false);
      return;
    }

    if (data) {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-danger/10 text-danger rounded-lg p-3 text-center text-sm font-medium">
          {error}
        </div>
      )}
      <div className="space-y-1.5 text-left">
        <label className="text-text-secondary text-sm font-medium" htmlFor="username">
          Username
        </label>
        <Input id="username" name="username" type="text" placeholder="Username" required />
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-text-secondary text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" placeholder="Password" required />
      </div>

      <Button className="mt-2 w-full" type="submit" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
}
