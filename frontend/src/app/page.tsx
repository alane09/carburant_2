import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'COFICAB ENERGIX | Gestion de Carburant',
  description: 'Plateforme de gestion et d\'analyse de consommation de carburant',
};

// Static homepage with redirect to dashboard
export default function Home() {
  // Server-side redirect is more efficient than client-side
  redirect('/dashboard');
}
