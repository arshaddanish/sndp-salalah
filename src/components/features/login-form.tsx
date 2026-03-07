'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // eslint-disable-next-line
    // TODO: Replace this mock authentication with real auth flow:
    // 1. Validate form inputs (username, password) from the form elements
    // 2. Call your authentication endpoint/service:
    //    - NextAuth signIn() method, OR
    //    - POST to /api/login endpoint, OR
    //    - Next.js server action for authentication
    // 3. Handle authentication response:
    //    - On success: call router.push('/') to redirect to dashboard
    //    - On failure: set error state (add setError state or similar) and display to user
    // 4. Always set setIsLoading(false) on completion or error
    // 5. Only proceed with router.push('/') after successful authentication validation

    // Mock implementation (remove after implementing real auth)
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push('/');
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
