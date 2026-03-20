import { redirect } from 'next/navigation';

// Root page just redirects — actual logic is in dashboard/login
export default function Home() {
  redirect('/dashboard');
}
