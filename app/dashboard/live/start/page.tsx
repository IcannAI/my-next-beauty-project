import { getCurrentUser } from '@/infrastructure/auth/auth';
import { redirect } from 'next/navigation';
import StartLiveForm from './StartLiveForm';

export default async function StartLivePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'KOL' && user.role !== 'ADMIN')) {
    redirect('/');
  }
  return <StartLiveForm />;
}
