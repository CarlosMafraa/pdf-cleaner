import React, { useRef, useState, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function FileUploader({ onFilesSelected, multiple = true }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFiles = useCallback((files) => {
    const validFiles = []
    const errors = []

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        errors.push(`"${file.name}" não é um PDF válido`)
      } else if (file.size > 50 * 1024 * 1024) {
        errors.push(`"${file.name}" excede o limite de 50MB`)
      } else {
        validFiles.push(file)
      }
    }

    return { validFiles, errors }
  }, [])

  const handleFiles = useCallback((files) => {
    setError(null)
    const { validFiles, errors } = validateFiles(Array.from(files))
    
    if (errors.length > 0) {
      setError(errors.join('. '))
    }
    
    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]])
    }
  }, [validateFiles, onFilesSelected, multiple])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="space-y-6">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
        className={cn(
          "relative border-2 border-dashed rounded-[2rem] p-8 sm:p-12 text-center cursor-pointer transition-all duration-300",
          isDragOver 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-foreground/5 hover:bg-muted/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className={cn(
            "w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300",
            isDragOver ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
          )}>
            <Upload 
              size={28} 
              className="transition-colors"
            />
          </div>
          
          <h3 className="text-xl font-bold mb-1 tracking-tight">
            {isDragOver ? 'Solte para processar' : 'Carregar Documentos'}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-6">
            Arraste e solte ou selecione PDFs
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
               <p className="label-md uppercase">Padrão PDF</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
               <p className="label-md uppercase">Máx 50MB</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-6 bg-destructive/5 rounded-2xl text-sm text-destructive leading-relaxed">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  )
}

export function FileList({ files, onRemove }) {
  if (files.length === 0) return null

  return (
    <div className="space-y-6">
      <p className="label-md tracking-[0.2em] text-primary uppercase">
        Fila de Documentos ({files.length})
      </p>
      
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
        {files.map((file, index) => (
          <div 
            key={`${file.name}-${index}`}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-xl group hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-primary/60" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-foreground">
                  {file.name}
                </p>
                <div className="flex items-center gap-3">
                   <p className="text-[10px] font-mono text-muted-foreground uppercase">
                     {(file.size / 1024 / 1024).toFixed(2)} MB
                   </p>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
