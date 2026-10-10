'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { listHouseholds } from '@/lib/households/household-service';

export default function HouseholdsPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Finding your household…');

  useEffect(() => {
    void listHouseholds()
      .then((households) => {
        const [household] = households;
        if (!household) {
          setMessage('No household is available for this account yet.');
          return;
        }
        router.replace(`/households/${household.id}`);
      })
      .catch(() =>
        setMessage('We could not load your household. Please try again.'),
      );
  }, [router]);

  return <p role="status">{message}</p>;
}
