'use client';

import { Camera, Check, User, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { requestMemberPhotoUpload, updateMemberPhoto } from '@/lib/actions/members';
import { MEMBER_PHOTO_DEFAULT_MAX_BYTES } from '@/lib/validations/members';

type MemberPhotoEditorProps = {
  memberId: string;
  currentPhotoUrl: string | null;
  memberName: string;
  maxSizeBytes?: number;
};

export function MemberPhotoEditor({
  memberId,
  currentPhotoUrl,
  memberName,
  maxSizeBytes = MEMBER_PHOTO_DEFAULT_MAX_BYTES,
}: Readonly<MemberPhotoEditorProps>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const triggerPicker = () => {
    if (!isPending) fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '');
      const maxSizeLabel =
        maxSizeBytes < 1024 * 1024 ? `${Math.round(maxSizeBytes / 1024)}KB` : `${maxSizeMB}MB`;

      setErrorMessage(`Photo must be ${maxSizeLabel} or smaller.`);
      setPendingFile(null);
      setPreviewUrl(null);
      event.target.value = '';
      return;
    }

    setErrorMessage(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset so the same file can be re-selected if discarded
    event.target.value = '';
  };

  const handleDiscard = () => {
    setPendingFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (!pendingFile) return;
    setErrorMessage(null);
    startTransition(async () => {
      const uploadConfig = await requestMemberPhotoUpload({
        fileName: pendingFile.name,
        fileType: pendingFile.type,
        fileSize: pendingFile.size,
      });

      if (!uploadConfig.success || !uploadConfig.data) {
        setErrorMessage(uploadConfig.error ?? 'Unable to prepare photo upload.');
        return;
      }

      const uploadResponse = await fetch(uploadConfig.data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': pendingFile.type,
        },
        body: pendingFile,
      });

      if (!uploadResponse.ok) {
        setErrorMessage('Unable to upload photo. Please try again.');
        return;
      }

      const result = await updateMemberPhoto(memberId, uploadConfig.data.photoKey);
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to update photo. Please try again.');
        return;
      }
      // Revalidation in the server action refreshes the server-rendered photo_key.
      setPendingFile(null);
      setPreviewUrl(null);
    });
  };

  const displaySrc = previewUrl ?? currentPhotoUrl;
  const hasPendingChange = Boolean(pendingFile) && !isPending;

  return (
    <div className="flex flex-col items-start gap-3">
      {/* Photo container */}
      <div className="relative h-48 w-48 shrink-0">
        <div className="bg-surface-hover border-border relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl border">
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt={memberName}
              fill
              unoptimized
              sizes="192px"
              className="object-contain"
            />
          ) : (
            <User className="text-text-muted h-14 w-14" />
          )}

          {isPending && (
            <div className="bg-text-primary/40 absolute inset-0 flex items-center justify-center rounded-xl">
              <span className="border-accent h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Camera badge — always visible for touch-device discoverability */}
        {!isPending && (
          <button
            type="button"
            onClick={triggerPicker}
            aria-label="Change member photo"
            className="bg-accent hover:bg-accent-hover text-text-on-dark absolute -right-2 -bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full shadow-md transition-colors"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Save / Discard controls — appear after a file is picked */}
      {hasPendingChange && (
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" onClick={handleSave} aria-label="Save photo">
            <Check />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleDiscard}
            aria-label="Discard photo changes"
          >
            <X />
          </Button>
        </div>
      )}

      {errorMessage && <p className="text-danger text-xs">{errorMessage}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Photo file input"
        onChange={handleFileChange}
      />
    </div>
  );
}
