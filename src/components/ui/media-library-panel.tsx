"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NeuralButton } from '@/components/ui/neural-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaUpload } from '@/components/ui/media-upload';
import { toast } from 'sonner';
import {
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  File,
  Upload,
  HardDrive,
  Grid3x3,
  List,
  X
} from 'lucide-react';

interface MediaFile {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface MediaLibraryPanelProps {
  moduleId?: string;
  onMediaSelect?: (file: MediaFile, altText?: string, caption?: string) => void;
  className?: string;
}

async function fetchMediaFiles(moduleId?: string): Promise<MediaFile[]> {
  const url = moduleId
    ? `/api/media/upload?moduleId=${moduleId}`
    : '/api/media/upload';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch media files');
  }
  const data = await response.json();
  return data.media || [];
}

export function MediaLibraryPanel({
  moduleId,
  onMediaSelect,
  className = ''
}: MediaLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showAltTextDialog, setShowAltTextDialog] = useState(false);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showAltTextDialog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAltTextDialog])

  const { data: mediaFiles = [], isLoading, refetch } = useQuery({
    queryKey: ['media-files', moduleId],
    queryFn: () => fetchMediaFiles(moduleId),
  });

  const filteredFiles = mediaFiles.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const imageFiles = filteredFiles.filter(f => f.mimeType.startsWith('image/'));
  const videoFiles = filteredFiles.filter(f => f.mimeType.startsWith('video/'));
  const documentFiles = filteredFiles.filter(f => !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/'));

  const totalSize = mediaFiles.reduce((acc, file) => acc + file.fileSize, 0);
  const maxSize = 100 * 1024 * 1024; // 100MB limit

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

  const handleFileClick = (file: MediaFile) => {
    if (file.mimeType.startsWith('image/')) {
      setSelectedFile(file);
      setAltText('');
      setCaption('');
      setShowAltTextDialog(true);
    } else {
      // For non-images, insert directly
      onMediaSelect?.(file);
      toast.success('File inserted');
    }
  };

  const handleInsertWithAltText = () => {
    if (selectedFile) {
      onMediaSelect?.(selectedFile, altText || selectedFile.originalName, caption);
      setShowAltTextDialog(false);
      setSelectedFile(null);
      setAltText('');
      setCaption('');
      toast.success('Image inserted');
    }
  };

  const handleUploadComplete = useCallback((file: MediaFile) => {
    refetch();
    toast.success('File uploaded successfully');
  }, [refetch]);

  return (
    <Card className={`cognitive-card flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <HardDrive className="mr-2 h-5 w-5 text-neural-primary" />
          Media Library
        </CardTitle>
        <CardDescription>
          Manage and insert media files
        </CardDescription>

        {/* Storage Usage */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Storage Used</span>
            <span>{formatFileSize(totalSize)} / {formatFileSize(maxSize)}</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-gradient-neural h-2 rounded-full transition-all"
              style={{ width: `${Math.min((totalSize / maxSize) * 100, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 pb-4 pt-5">
        <Tabs defaultValue="library" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm h-11 overflow-hidden p-1.5 gap-1">
            <TabsTrigger value="library" className="px-2 sm:px-4 shadow-none data-[state=active]:shadow-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="px-2 sm:px-4 shadow-none data-[state=active]:shadow-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col space-y-3 mt-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{filteredFiles.length} files</Badge>
                {imageFiles.length > 0 && (
                  <Badge variant="outline">{imageFiles.length} images</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <NeuralButton
                  variant={viewMode === 'grid' ? 'neural' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </NeuralButton>
                <NeuralButton
                  variant={viewMode === 'list' ? 'neural' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </NeuralButton>
              </div>
            </div>

            {/* Files Grid/List */}
            <div className="flex-1 -mx-6 px-6 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gradient-to-r from-neural-light/20 to-neural-primary/20 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No files match your search' : 'No media files yet'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload files using the Upload tab
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className="group relative cursor-pointer rounded-lg border border-border hover:border-neural-primary transition-all overflow-hidden"
                    >
                      {file.mimeType.startsWith('image/') ? (
                        <div className="aspect-square bg-muted relative">
                          <Image
                            src={file.url}
                            alt={file.originalName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {getFileIcon(file.mimeType)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <NeuralButton variant="neural" size="sm">
                          Insert
                        </NeuralButton>
                      </div>
                      <div className="p-2 bg-background/95 backdrop-blur">
                        <p className="text-xs font-medium truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:border-neural-primary cursor-pointer transition-colors"
                    >
                      {file.mimeType.startsWith('image/') ? (
                        <Image
                          src={file.url}
                          alt={file.originalName}
                          width={48}
                          height={48}
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(file.mimeType)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {file.mimeType.split('/')[0]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </span>
                        </div>
                      </div>
                      <NeuralButton variant="ghost" size="sm">
                        Insert
                      </NeuralButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 mt-3">
            <MediaUpload
              onFileSelect={handleUploadComplete}
              moduleId={moduleId}
              maxFiles={10}
              showPreview={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Alt Text Dialog */}
      {showAltTextDialog && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] px-2 sm:px-4 pt-8 sm:pt-12 pb-4">
          <div className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Image Description</h3>
              <NeuralButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAltTextDialog(false);
                  setSelectedFile(null);
                  setAltText('');
                  setCaption('');
                }}
              >
                <X className="h-4 w-4" />
              </NeuralButton>
            </div>

            {/* Image Preview */}
            <div className="mb-4 relative h-48">
              <Image
                src={selectedFile.url}
                alt={selectedFile.originalName}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            {/* Alt Text Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">
                Alt Text (for accessibility)
              </label>
              <Input
                placeholder="Describe what's in the image..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This helps screen readers describe the image to visually impaired users.
              </p>
            </div>

            {/* Caption Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">
                Caption (optional)
              </label>
              <Input
                placeholder="e.g., Figure 1.1: Neural network architecture..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This text will appear below the image as a caption.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <NeuralButton
                variant="outline"
                onClick={() => {
                  setShowAltTextDialog(false);
                  setSelectedFile(null);
                  setAltText('');
                  setCaption('');
                }}
                className="flex-1"
              >
                Cancel
              </NeuralButton>
              <NeuralButton
                variant="synaptic"
                onClick={handleInsertWithAltText}
                className="flex-1"
              >
                Insert Image
              </NeuralButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
