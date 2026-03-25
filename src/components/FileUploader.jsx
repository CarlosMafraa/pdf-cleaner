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
    <div className="space-y-8">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
        className={cn(
          "relative rounded-[3rem] p-12 sm:p-20 text-center cursor-pointer transition-all duration-500 overflow-hidden group",
          isDragOver 
            ? "bg-primary/5 scale-[1.02] ring-2 ring-primary/20" 
            : "bg-muted/40 hover:bg-muted/60 ring-1 ring-primary/5"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={multiple}
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center relative z-10">
          <div className={cn(
            "w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-10 transition-all duration-500 shadow-sm",
            isDragOver ? "bg-primary text-white scale-110 rotate-6" : "bg-card text-primary/40 group-hover:text-primary group-hover:scale-105"
          )}>
            <Upload 
              size={32} 
              className="transition-transform duration-500 group-hover:-translate-y-1"
            />
          </div>
          
          <h3 className="title-md font-bold mb-3 tracking-tight text-primary">
            {isDragOver ? 'Pode Soltar Agora' : 'Inicie sua Limpeza'}
          </h3>
          
          <p className="label-sm text-primary/40 mb-10 tracking-widest uppercase">
            {isDragOver ? 'Processando Documentos...' : 'Selecione ou arraste seus PDFs aqui'}
          </p>
          
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
               <p className="label-sm font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Standard PDF</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
               <p className="label-sm font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Secure Node</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-4 p-8 bg-destructive/5 rounded-3xl text-sm text-destructive animate-in slide-in-from-top-4 duration-300">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
             <p className="font-bold label-sm uppercase tracking-widest">Ops, houve um erro</p>
             <p className="opacity-70 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function FileList({ files, onRemove }) {
  if (files.length === 0) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <p className="label-sm tracking-[0.3em] text-primary uppercase font-bold">
          Fila de Atendimento <span className="opacity-20 ml-2">[{files.length}]</span>
        </p>
      </div>
      
      <div className="grid gap-3 max-h-[340px] overflow-y-auto scrollbar-thin pr-4 pt-1">
        {files.map((file, index) => (
          <div 
            key={`${file.name}-${index}`}
            className="flex items-center justify-between p-5 bg-muted rounded-[1.5rem] group hover:bg-card hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-primary/[0.02]"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/[0.03]">
                <FileText size={22} className="text-primary/40 group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {file.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                   <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">
                     {(file.size / 1024 / 1024).toFixed(2)} MB
                   </p>
                   <div className="w-1 h-1 rounded-full bg-primary/10" />
                   <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest italic">Aguardando</p>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-10 w-10 text-primary/20 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
            >
              <X size={18} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
