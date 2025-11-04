'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NeuralButton } from '@/components/ui/neural-button'
import {
  Download,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Folder,
  HardDrive
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

interface ModuleResourcesProps {
  resources: MediaFile[]
  className?: string
}

export function ModuleResources({ resources, className = '' }: ModuleResourcesProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType === 'application/pdf') return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Presentation'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Spreadsheet'
    return 'File'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getTotalSize = (): string => {
    const total = resources.reduce((acc, file) => acc + file.size, 0)
    return formatFileSize(total)
  }

  if (resources.length === 0) {
    return null // Don't show the section if there are no resources
  }

  return (
    <Card className={`cognitive-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Folder className="mr-3 h-5 w-5 text-neural-primary" />
              Resources
            </CardTitle>
            <CardDescription className="mt-2">
              Download files and resources for this module
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <HardDrive className="mr-1.5 h-4 w-4" />
              <span>{getTotalSize()} total</span>
            </div>
            <Badge variant="outline">
              {resources.length} {resources.length === 1 ? 'file' : 'files'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 px-4 font-medium">Type</th>
                <th className="pb-3 px-4 font-medium text-right">Size</th>
                <th className="pb-3 pl-4 font-medium text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-border/30 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-neural-primary">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {file.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="secondary" className="text-xs">
                      {getFileType(file.mimeType)}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <NeuralButton variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </NeuralButton>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
