import { SignupForm } from '@/components/auth/signup-form';
import Link from 'next/link';
import AppLogo from '@/components/icons/app-logo';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
           <AppLogo className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-center font-headline text-3xl font-extrabold text-foreground">
            Create your Tokari account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Join Tokari and streamline your wealth management tasks.
          </p>
        </div>
        <SignupForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
