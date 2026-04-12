import { notFound } from 'next/navigation';

import { ActionsPlayground } from '@/components/features/dev/actions-playground';
import { isActionsWorkbenchEnabled } from '@/lib/env';

export const metadata = {
  title: 'Actions Workbench | SNDP Salalah',
  description: 'Developer-only workbench for running server actions.',
};

export default function ActionsPlaygroundPage() {
  if (!isActionsWorkbenchEnabled) {
    notFound();
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-10">
      <ActionsPlayground />
    </div>
  );
}
