'use client';

import { Printer } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import styles from './member-card-export.module.css';

// ---------------------------------------------------------------------------
// Payload type — keep all fields so the caller (page.tsx) needs no changes
// ---------------------------------------------------------------------------
export type MemberCardExportPayload = {
  memberCode: number;
  name: string;
  photoSrc: string | null; // presigned S3 URL, already resolved by page.tsx
  statusLabel: string;
  officeShakha: string;
  expiryLabel: string;
  dateOfBirthLabel: string | null;
  bloodGroup: string | null;
  phoneLabel: string | null;
  familyMemberNames: string[];
  civilIdNo: string | null;
  passportNo: string | null;
  profession: string | null;
  residentialArea: string | null;
  addressIndia: string | null;
  email: string | null;
  shakhaIndia: string | null;
  unionName: string | null;
  district: string | null;
  submittedBy: string | null;
  receivedOnLabel: string | null;
  checkedBy: string | null;
  approvedBy: string | null;
  president: string | null;
  secretary: string | null;
  applicationNo: string | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type MemberCardExportButtonProps = {
  payload: MemberCardExportPayload;
};

export function MemberCardExportButton({ payload }: Readonly<MemberCardExportButtonProps>) {
  const [isExporting, setIsExporting] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const frontInput = frontCardRef.current;
      const backInput = backCardRef.current;

      if (!frontInput || !backInput) {
        throw new Error('Card elements not found');
      }

      const frontRect = frontInput.getBoundingClientRect();
      const backRect = backInput.getBoundingClientRect();

      // scale factor to boost resolution
      const scale = 5;

      const frontCanvas = await html2canvas(frontInput, {
        useCORS: true,
        allowTaint: true,
        width: frontRect.width,
        height: frontRect.height,
        windowWidth: frontRect.width,
        windowHeight: frontRect.height,
        scale,
      });

      const backCanvas = await html2canvas(backInput, {
        useCORS: true,
        allowTaint: true,
        width: backRect.width,
        height: backRect.height,
        windowWidth: backRect.width,
        windowHeight: backRect.height,
        scale,
      });

      const pdf = new jsPDF({
        unit: 'px',
        format: [frontRect.width, frontRect.height],
        orientation: 'portrait',
      });

      // Front Page
      const frontImgData = frontCanvas.toDataURL('image/png');
      pdf.addImage(frontImgData, 'PNG', 0, 0, frontRect.width, frontRect.height);

      // Back Page
      pdf.addPage([backRect.width, backRect.height], 'portrait');
      const backImgData = backCanvas.toDataURL('image/png');
      pdf.addImage(backImgData, 'PNG', 0, 0, backRect.width, backRect.height);

      pdf.save(`${payload.memberCode}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('An error occurred while generating the ID card PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const photoSrcUrl = payload.photoSrc || '/id-card-user-placeholder.png'; // default fallback from legacy

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 whitespace-nowrap"
        onClick={handleExport}
        disabled={isExporting}
        aria-label="Download member ID card PDF"
      >
        <Printer className="mr-2 h-4 w-4" />
        {isExporting ? 'Generating...' : 'Print Card'}
      </Button>

      {/* Hidden card container for html2canvas to render */}
      <div className={styles['']} aria-hidden="true">
        <div ref={frontCardRef} className={styles['']}>
          <div className={styles['']}>
            <h2>SNDP YOGAM, OMAN</h2>
            <h2>SALALAH UNION</h2>
          </div>

          <div className={styles['']}></div>

          <div className={styles['']}>
            <p>
              <em>&quot;Educate and Enlighten</em>
            </p>
            <p>
              <em>Organize and Strengthen&quot;</em>
            </p>
          </div>

          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoSrcUrl} crossOrigin="anonymous" alt="User" />
          </div>

          <div className={styles['']}>
            <p className={styles['']}>{payload.name || ' '}</p>
            <p className={styles['']}>{payload.officeShakha || ' '}</p>
            <p className={styles['']}>ID No: {payload.memberCode || ' '}</p>
          </div>

          <div className={styles['']}>
            <p className={styles['']}>Valid Upto {payload.expiryLabel || ' '}</p>
          </div>

          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-logo.png" alt="" />
          </div>
          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-side.png" alt="" />
          </div>
          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-bottom.png" alt="" />
          </div>
        </div>

        <div ref={backCardRef} className={styles['']}>
          <div className={styles['']}>
            <h3 className={styles['']}>FAMILY MEMBERS</h3>
            {(payload.familyMemberNames || []).map((name, i) => (
              <p key={i} className={styles['']}>
                {name}
              </p>
            ))}
          </div>

          <div className={styles['']}>
            <p className={styles['']}>DOB: {payload.dateOfBirthLabel || '—'}</p>
            <p className={styles['']}>Blood: {payload.bloodGroup || '—'}</p>
            <p className={styles['']}>Phone: {payload.phoneLabel || '—'}</p>
          </div>

          <div className={styles['']}>
            <p className={styles['']}>Email: salalahsndp@gmail.com</p>
          </div>

          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-logo.png" alt="" />
          </div>
          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-side.png" alt="" />
          </div>
          <div className={styles['']}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/id-card-back.png" alt="" />
          </div>
        </div>
      </div>
    </>
  );
}
