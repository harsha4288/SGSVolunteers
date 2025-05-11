
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Middleware will handle redirection to /login or /app/dashboard
  // This page component might not even be hit if middleware always redirects.
  // However, as a fallback, or if middleware logic changes,
  // redirecting to /app/dashboard is a sensible default assumption for an authenticated app.
  // If a user hits this directly and middleware hasn't run (e.g. misconfig), this provides a path.
  redirect('/app/dashboard'); 
}
