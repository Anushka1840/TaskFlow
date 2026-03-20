'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// This hook checks if the user is logged in.
// Returns: { user, authChecked }
// authChecked = false means we're still checking → show a spinner, not the page
// This prevents the flash where the dashboard briefly shows before redirecting

export function useAuth() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!stored || !token) {
      router.replace('/login'); // replace so back button can't return to dashboard
      return;
    }

    setUser(JSON.parse(stored));
    setAuthChecked(true);

    // Prevent back button returning to dashboard after logout
    // We push a new history entry so back goes to login, not here
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      const t = localStorage.getItem('accessToken');
      if (!t) {
        router.replace('/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  return { user, authChecked };
}
