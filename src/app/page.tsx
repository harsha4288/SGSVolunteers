
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/app/dashboard');
  // return null; // redirect will prevent rendering, but good practice
}
