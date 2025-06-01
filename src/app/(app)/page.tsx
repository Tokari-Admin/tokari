'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthenticatedRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/deleguer');
  }, [router]);

  return null; // Or a loading indicator
}
