"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import ResizableImageExtension from 'tiptap-extension-resize-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useEffect, useState, useRef } from 'react'
import { NeuralButton } from '@/components/ui/neural-button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Save,
  Type,
  FileText,
  Upload,
  X
} from 'lucide-react'
import { MediaUpload } from '@/components/ui/media-upload'

interface NeuralRichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  placeholder?: string
  autoSave?: boolean
  autoSaveDelay?: number
  className?: string
  moduleId?: string
  onEditorReady?: (insertImage: (url: string, alt?: string, caption?: string) => void) => void
}

export function NeuralRichTextEditor({
  content = '',
  onChange,
  onSave,
  placeholder = 'Start writing your module content...',
  autoSave = true,
  autoSaveDelay = 2000,
  className = '',
  moduleId,
  onEditorReady
}: NeuralRichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We'll use our custom heading extension
        link: false, // We'll use our custom link extension to avoid duplicates
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      ResizableImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg shadow-neural my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-neural-primary hover:text-neural-deep underline transition-colors',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6 neural-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      
      setWordCount(text.split(/\s+/).filter(word => word.length > 0).length)
      setCharacterCount(text.length)
      
      onChange?.(html)

      // Auto-save functionality
      if (autoSave && onSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          handleSave(html)
        }, autoSaveDelay)
      }
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose insertImage function to parent component
  useEffect(() => {
    if (editor && onEditorReady) {
      const insertImage = (url: string, alt?: string, caption?: string) => {
        // Insert image with caption stored in title attribute
        editor.chain().focus().setImage({
          src: url,
          alt: alt || '',
          title: caption || '' // Store caption in title for now
        }).run()
      }
      onEditorReady(insertImage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleSave = useCallback(async (contentToSave?: string) => {
    if (!editor || !onSave) return

    const html = contentToSave || editor.getHTML()
    setIsSaving(true)

    try {
      await onSave(html)
      toast.success('Content saved successfully!')
    } catch (error) {
      toast.error('Failed to save content')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [editor, onSave])

  const addImage = useCallback(() => {
    setShowMediaUpload(true)
  }, [])

  const handleMediaSelect = useCallback((file: any) => {
    if (file.mimeType.startsWith('image/')) {
      editor?.chain().focus().setImage({
        src: file.url,
        alt: file.originalName,
        title: file.originalName
      }).run()
    }
    setShowMediaUpload(false)
  }, [editor])

  const addImageFromUrl = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('Enter link URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!isMounted || !editor) {
    return (
      <Card className="cognitive-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gradient-to-r from-neural-light/30 to-neural-primary/30 rounded w-3/4"></div>
            <div className="h-4 bg-gradient-to-r from-neural-primary/30 to-neural-light/30 rounded w-1/2"></div>
            <div className="h-32 bg-gradient-to-br from-neural-light/20 to-cognition-teal/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`cognitive-card ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-border/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant={editor.isActive('bold') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('italic') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('strike') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('code') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code className="h-4 w-4" />
            </NeuralButton>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant={editor.isActive('heading', { level: 1 }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('heading', { level: 2 }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('heading', { level: 3 }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4" />
            </NeuralButton>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant={editor.isActive('bulletList') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('orderedList') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive('blockquote') ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </NeuralButton>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant={editor.isActive({ textAlign: 'left' }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive({ textAlign: 'center' }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant={editor.isActive({ textAlign: 'right' }) ? 'neural' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="h-4 w-4" />
            </NeuralButton>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Media */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant="ghost"
              size="sm"
              onClick={addLink}
            >
              <LinkIcon className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant="ghost"
              size="sm"
              onClick={addImage}
              title="Add Image"
            >
              <Upload className="h-4 w-4" />
            </NeuralButton>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* History */}
          <div className="flex items-center gap-1">
            <NeuralButton
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </NeuralButton>
            <NeuralButton
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </NeuralButton>
          </div>

          {/* Save Button */}
          {onSave && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <NeuralButton
                variant="synaptic"
                size="sm"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </NeuralButton>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <CardContent className="p-0">
        <div className="relative">
          <EditorContent 
            editor={editor} 
            className="neural-editor-wrapper"
          />
          {editor.isEmpty && (
            <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer Stats */}
      <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Type className="h-3 w-3" />
            <span>{wordCount} words</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{characterCount} characters</span>
          </div>
        </div>
        
        {autoSave && (
          <div className="text-xs text-neural-primary">
            Auto-save enabled
          </div>
        )}
      </div>

      {/* Media Upload Dialog */}
      {showMediaUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Media</h3>
              <NeuralButton
                variant="ghost"
                size="sm"
                onClick={() => setShowMediaUpload(false)}
              >
                <X className="h-4 w-4" />
              </NeuralButton>
            </div>

            <MediaUpload
              onFileSelect={handleMediaSelect}
              moduleId={moduleId}
              maxFiles={1}
              showPreview={true}
              className="mb-4"
            />

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Or add image from URL:</p>
              <NeuralButton
                variant="outline"
                onClick={addImageFromUrl}
                className="w-full"
              >
                Add Image from URL
              </NeuralButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
