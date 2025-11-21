import { redirect } from 'next/navigation';

// Redirect to the new unified learning page
// This route is kept for backwards compatibility
export default function ProgressPage() {
  redirect('/learning');
}
