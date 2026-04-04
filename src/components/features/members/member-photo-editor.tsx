'use client';

import { Camera, Check, User, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { updateMemberPhoto } from '@/lib/actions/members';
import { uploadMemberPhoto } from '@/lib/s3/member-photo-upload';

type MemberPhotoEditorProps = {
  memberId: string;
  currentPhotoKey: string | null;
  memberName: string;
};

export function MemberPhotoEditor({
  memberId,
  currentPhotoKey,
  memberName,
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
      const uploadResult = await uploadMemberPhoto(pendingFile);
      const result = await updateMemberPhoto(memberId, uploadResult.photoKey);
      if (!result.success) {
        setErrorMessage(result.error ?? 'Unable to update photo. Please try again.');
        return;
      }
      // Revalidation in the server action refreshes the server-rendered photo_key.
      setPendingFile(null);
      setPreviewUrl(null);
    });
  };

  const displaySrc = previewUrl ?? currentPhotoKey;
  const hasPendingChange = Boolean(pendingFile) && !isPending;

  return (
    <div className="flex flex-col items-start gap-3">
      {/* Photo container */}
      <div className="relative h-36 w-36 shrink-0">
        <div className="bg-surface-hover border-border relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border">
          {displaySrc ? (
            <Image
              src={displaySrc}
              alt={memberName}
              fill
              unoptimized
              sizes="144px"
              className="object-cover"
            />
          ) : (
            <User className="text-text-muted h-14 w-14" />
          )}

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
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
            className="bg-accent hover:bg-accent-hover absolute -right-2 -bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-colors"
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
