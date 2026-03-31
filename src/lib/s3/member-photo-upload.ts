export type MemberPhotoUploadResult = {
  photoKey: string;
};

/**
 * Temporary upload adapter for phase 1.
 * Keeps a stable contract so S3-backed upload can replace this without form/action changes.
 */
export const uploadMemberPhoto = async (file: File): Promise<MemberPhotoUploadResult> => {
  const normalizedName = file.name.trim().replace(/\s+/g, '-').toLowerCase();
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().slice(0, 8);

  return {
    photoKey: `temp/member-photos/${timestamp}-${randomSuffix}-${normalizedName}`,
  };
};
