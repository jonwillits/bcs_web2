"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';
import { NeuralButton } from '@/components/ui/neural-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

interface MediaUploadProps {
  onFileSelect?: (file: MediaFile) => void;
  moduleId?: string;
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

export function MediaUpload({
  onFileSelect,
  moduleId,
  maxFiles = 5,
  showPreview = false,
  className = ''
}: MediaUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);

    for (const file of acceptedFiles.slice(0, maxFiles)) {
      const fileId = `${Date.now()}_${file.name}`;

      try {
        // Initialize progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Step 1: Get signed upload URL from server
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));

        const urlResponse = await fetch('/api/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!urlResponse.ok) {
          const error = await urlResponse.json();
          throw new Error(error.error || 'Failed to get upload URL');
        }

        const { signedUrl, filePath } = await urlResponse.json();

        // Step 2: Upload directly to Supabase Storage
        setUploadProgress(prev => ({ ...prev, [fileId]: 20 }));

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = 20 + (e.loaded / e.total) * 60; // 20-80%
              setUploadProgress(prev => ({ ...prev, [fileId]: percentComplete }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          xhr.open('PUT', signedUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        await uploadPromise;

        // Step 3: Confirm upload and save metadata
        setUploadProgress(prev => ({ ...prev, [fileId]: 85 }));

        const confirmResponse = await fetch('/api/media/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            moduleId,
          }),
        });

        if (!confirmResponse.ok) {
          const error = await confirmResponse.json();
          throw new Error(error.error || 'Failed to save file metadata');
        }

        const result = await confirmResponse.json();

        // Complete progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        // Add to uploaded files
        const newFile: MediaFile = result.media;
        setUploadedFiles(prev => [...prev, newFile]);

        // Notify parent component
        if (onFileSelect) {
          onFileSelect(newFile);
        }

        toast.success(`${file.name} uploaded successfully`);

        // Clean up progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }, 2000);

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Clean up failed upload progress
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }
    }

    setIsUploading(false);
  }, [moduleId, maxFiles, onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB - Direct upload to Supabase bypasses Vercel limits
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Maximum file size is 50MB.`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <Card className="cognitive-card">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive
                ? 'border-neural-primary bg-neural-primary/5'
                : 'border-border hover:border-neural-primary/50 hover:bg-neural-primary/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

            {isDragActive ? (
              <p className="text-lg font-medium text-neural-primary">
                Drop files here...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports images, videos, audio, PDFs, and text files up to 50MB
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum {maxFiles} files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Upload Progress</h4>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">
                      {fileId.split('_').slice(1).join('_')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.mimeType)}
                    <div>
                      <p className="font-medium text-sm">{file.originalName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {file.mimeType.split('/')[0]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <NeuralButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (onFileSelect) {
                          onFileSelect(file);
                        }
                      }}
                    >
                      Use
                    </NeuralButton>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}