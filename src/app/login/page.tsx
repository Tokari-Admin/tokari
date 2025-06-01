import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import AppLogo from '@/components/icons/app-logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <AppLogo className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-center font-headline text-3xl font-extrabold text-foreground">
            Sign in to Tokari
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Manage your client delegations with ease.
          </p>
        </div>
        <LoginForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
