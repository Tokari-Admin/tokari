'use client';

import { ProfileForm } from '@/components/auth/profile-form';

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          User Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account details and preferences.
        </p>
      </header>
      <ProfileForm />
    </div>
  );
}
