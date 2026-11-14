import { useEffect } from 'react';
import { useRouter } from '@/router';
import { CollectionsPage } from './CollectionsPage';

/**
 * Backward compatibility wrapper for BlueprintsPage.
 * Redirects legacy route to CollectionsPage child view (tab = 'blueprints').
 */
export const BlueprintsPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (router.params.tab !== 'blueprints') {
      router.replace('collections', { tab: 'blueprints' });
    }
  }, [router]);

  return <CollectionsPage />;
};
