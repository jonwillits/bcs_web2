import { supabase, MEDIA_BUCKET } from './supabase';

// File validation for uploads
export const validateFile = (file: File, config: any): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
};

// Upload file to Supabase Storage
export const uploadFile = async (file: File): Promise<{ url: string; path: string }> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const filename = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = `uploads/${filename}`;

    // Upload to Supabase Storage (pass File directly, not ArrayBuffer)
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};