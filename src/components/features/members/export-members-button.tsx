'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchMembersForExport } from '@/lib/actions/members';
import { exportMembersToExcel } from '@/lib/export/members-excel';

type Filters = {
  q?: string;
  status?: string;
  shakha?: string;
  activeWindowStart?: string;
  activeWindowEnd?: string;
};

export function ExportMembersButton({ filters }: Readonly<{ filters: Filters }>) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await fetchMembersForExport(filters);
      if (result.success && result.data) {
        await exportMembersToExcel(result.data);
      } else {
        alert(result.error ?? 'Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting members:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-8"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export'}
    </Button>
  );
}
