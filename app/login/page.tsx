import { LoginForm } from '@/components/features/login-form';

export const metadata = {
  title: 'Login | SNDP Salalah',
  description: 'Sign in to the SNDP Salalah Membership Portal',
};

export default function LoginPage() {
  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-surface w-full max-w-sm rounded-xl border p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-text-primary mb-1 text-2xl font-bold">
            SNDP <span className="text-accent">Salalah</span>
          </h1>
          <p className="text-text-secondary text-sm">Sign in to your account</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
