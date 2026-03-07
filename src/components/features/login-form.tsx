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

    // Simulate a brief network delay for "premium" feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    router.push('/');
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1.5 text-left">
        <label className="text-text-secondary text-sm font-medium" htmlFor="username">
          Username
        </label>
        <Input id="username" type="text" placeholder="Username" required />
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-text-secondary text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input id="password" type="password" placeholder="Password" required />
      </div>

      <Button className="mt-2 w-full" type="submit" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  );
}
