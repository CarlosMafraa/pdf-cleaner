import React, { useState, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { FileText, Shield, Zap, Ruler, Github, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUploader, FileList } from '@/components/FileUploader'
import { PDFEditor } from '@/components/PDFEditor'

function App() {
  const [files, setFiles] = useState([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [pdfBytes, setPdfBytes] = useState(null)
  const [pdfInfo, setPdfInfo] = useState(null)
  const [processedPdf, setProcessedPdf] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [view, setView] = useState('upload')

  const loadPDF = useCallback(async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    
    setPdfBytes(bytes)
    setPdfInfo({
      totalPages: pdf.numPages,
      width: viewport.width,
      height: viewport.height
    })
    setProcessedPdf(null)
    setView('editor')
  }, [])

  const handleFilesSelected = useCallback(async (selectedFiles) => {
    setFiles(selectedFiles)
    if (selectedFiles.length > 0) {
      await loadPDF(selectedFiles[0])
    }
  }, [loadPDF])

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    if (files.length === 1) {
      setView('upload')
      setPdfBytes(null)
      setPdfInfo(null)
    }
  }, [files.length])

  const handleProcess = useCallback(async (options) => {
    if (!pdfBytes) return

    setIsProcessing(true)

    try {
      let processedBytes

      // --- Tentativa 1: pdf-lib (preserva camada de texto) ---
      try {
        // Alguns PDFs têm bytes extras antes do header %PDF — busca e remove
        let bytesToLoad = pdfBytes
        const maxSearch = Math.min(1024, pdfBytes.length - 4)
        for (let i = 1; i < maxSearch; i++) {
          if (pdfBytes[i] === 0x25 && pdfBytes[i+1] === 0x50 && pdfBytes[i+2] === 0x44 && pdfBytes[i+3] === 0x46) {
            bytesToLoad = pdfBytes.slice(i)
            break
          }
        }

        const srcDoc = await PDFDocument.load(bytesToLoad, { ignoreEncryption: true })
        const pages = srcDoc.getPages()

        for (const page of pages) {
          const { width, height } = page.getSize()
          const rotation = page.getRotation().angle

          if (options.removeAnnotations) {
            try {
              const { PDFName } = await import('pdf-lib')
              const annotsRef = page.node.lookup(PDFName.of('Annots'))
              if (annotsRef) page.node.delete(PDFName.of('Annots'))
            } catch (e) {}
          }

          const { margins } = options
          
          // Desenhar retângulos brancos respeitando a rotação da página
          // pdf-lib desenha no sistema de coordenadas da página (que pode estar rotacionado)
          // Mas os campos width/height retornados por getSize() são os originais (antes da rotação)
          // se rotation for 90 ou 270, width e height visualmente se invertem.
          
          const drawRect = (rect) => page.drawRectangle({ ...rect, color: rgb(1,1,1), borderWidth: 0 })

          if (rotation === 0) {
            if (margins.top > 0)    drawRect({ x: 0, y: height - margins.top, width, height: margins.top })
            if (margins.bottom > 0) drawRect({ x: 0, y: 0, width, height: margins.bottom })
            if (margins.left > 0)   drawRect({ x: 0, y: 0, width: margins.left, height })
            if (margins.right > 0)  drawRect({ x: width - margins.right, y: 0, width: margins.right, height })
          } else if (rotation === 90) {
            // Visual Top is Original Left
            if (margins.top > 0)    drawRect({ x: 0, y: 0, width: margins.top, height })
            // Visual Bottom is Original Right
            if (margins.bottom > 0) drawRect({ x: width - margins.bottom, y: 0, width: margins.bottom, height })
            // Visual Left is Original Bottom
            if (margins.left > 0)   drawRect({ x: 0, y: 0, width, height: margins.left })
            // Visual Right is Original Top
            if (margins.right > 0)  drawRect({ x: 0, y: height - margins.right, width, height: margins.right })
          } else if (rotation === 180) {
            // Visual Top is Original Bottom
            if (margins.top > 0)    drawRect({ x: 0, y: 0, width, height: margins.top })
            if (margins.bottom > 0) drawRect({ x: 0, y: height - margins.bottom, width, height: margins.bottom })
            if (margins.left > 0)   drawRect({ x: width - margins.left, y: 0, width: margins.left, height })
            if (margins.right > 0)  drawRect({ x: 0, y: 0, width: margins.right, height })
          } else if (rotation === 270) {
            // Visual Top is Original Right
            if (margins.top > 0)    drawRect({ x: width - margins.top, y: 0, width: margins.top, height })
            if (margins.bottom > 0) drawRect({ x: 0, y: 0, width: margins.bottom, height })
            if (margins.left > 0)   drawRect({ x: 0, y: height - margins.left, width, height: margins.left })
            if (margins.right > 0)  drawRect({ x: 0, y: 0, width, height: margins.right })
          }
        }

        processedBytes = await srcDoc.save()

      } catch (pdfLibErr) {
        // --- Fallback: renderiza via pdfjs e reconstrói como imagens ---
        console.warn('pdf-lib falhou, usando fallback por imagem:', pdfLibErr.message)

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) })
        const pdfDoc = await loadingTask.promise
        const newDoc = await PDFDocument.create()

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum)
          const viewport = page.getViewport({ scale: 2 })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')

          await page.render({ canvasContext: ctx, viewport }).promise

          // Aplica retângulos brancos nas margens
          const { margins } = options
          const s = viewport.scale
          ctx.fillStyle = 'white'
          if (margins.top > 0)    ctx.fillRect(0, 0, viewport.width, margins.top * s)
          if (margins.bottom > 0) ctx.fillRect(0, viewport.height - margins.bottom * s, viewport.width, margins.bottom * s)
          if (margins.left > 0)   ctx.fillRect(0, 0, margins.left * s, viewport.height)
          if (margins.right > 0)  ctx.fillRect(viewport.width - margins.right * s, 0, margins.right * s, viewport.height)

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
          const imgBytes = await fetch(dataUrl).then(r => r.arrayBuffer())
          const img = await newDoc.embedJpg(imgBytes)

          const origViewport = page.getViewport({ scale: 1 })
          const newPage = newDoc.addPage([origViewport.width, origViewport.height])
          newPage.drawImage(img, { x: 0, y: 0, width: origViewport.width, height: origViewport.height })
        }

        processedBytes = await newDoc.save()
      }

      setProcessedPdf(new Uint8Array(processedBytes))
    } catch (e) {
      console.error('Erro ao processar:', e)
      alert('Erro ao processar o PDF: ' + e.message)
    }

    setIsProcessing(false)
  }, [pdfBytes])

  const handleBack = useCallback(() => {
    setView('upload')
    setPdfBytes(null)
    setPdfInfo(null)
    setProcessedPdf(null)
  }, [])

  if (view === 'editor' && pdfBytes && pdfInfo) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <PDFEditor
          file={files[currentFileIndex]}
          pdfBytes={pdfBytes}
          pdfInfo={pdfInfo}
          onBack={handleBack}
          onProcess={handleProcess}
          processedPdf={processedPdf}
          isProcessing={isProcessing}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Editorial Header */}
      <header className="bg-muted px-6 sm:px-12 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl">
              <FileText size={20} className="text-primary-foreground" />
            </div>
            <p className="label-md font-bold tracking-[0.2em] text-foreground">
              THE SILENT ARCHITECT
            </p>
          </div>
          
          <p className="hidden md:block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Precision Document Archive
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Section 1: Hero */}
        <section className="pt-24 pb-20 sm:pt-40 sm:pb-32">
          <div className="max-w-4xl">
            <h1 className="text-5xl sm:text-8xl font-bold tracking-tighter leading-[0.95] text-foreground mb-8">
              Refined <br /> Cleaning Studio.
            </h1>
            <p className="text-lg sm:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Define your architectural perimeter. Remove digital debris with surgical precision using our mechanical drafting interface.
            </p>
          </div>
        </section>

        {/* Section 2: Core Workspace - Upload Focused */}
        <section className="mb-40">
          <div className="max-w-3xl mx-auto bg-muted p-6 sm:p-12 rounded-[2rem]">
            <div className="bg-background rounded-2xl border-none p-8 sm:p-20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <FileUploader 
                onFilesSelected={handleFilesSelected}
                multiple={true}
              />
              
              {files.length > 0 && (
                <div className="mt-12 pt-12 border-t border-muted">
                  <FileList files={files} onRemove={handleRemoveFile} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Professional Ledger (Cards) */}
        <section className="grid md:grid-cols-3 gap-12 pb-40 border-t border-muted pt-24">
          <div className="space-y-6">
             <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Ruler size={24} className="text-primary" />
             </div>
             <p className="label-md text-primary tracking-[0.2em]">01 / DRAFTING</p>
             <h3 className="text-2xl font-bold tracking-tight">Precision Rulers</h3>
             <p className="text-muted-foreground leading-relaxed text-sm">
                Utilize tactile mechanical guides to define crop areas with sub-pixel accuracy across your entire document.
             </p>
          </div>

          <div className="space-y-6">
             <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Zap size={24} className="text-primary" />
             </div>
             <p className="label-md text-primary tracking-[0.2em]">02 / PROCESSING</p>
             <h3 className="text-2xl font-bold tracking-tight">Clean Result</h3>
             <p className="text-muted-foreground leading-relaxed text-sm">
                Remove signatures, annotations, and margin noise instantly. Export high-resolution files ready for formal archives.
             </p>
          </div>

          <div className="space-y-6">
             <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-primary" />
             </div>
             <p className="label-md text-primary tracking-[0.2em]">03 / PHILOSOPHY</p>
             <h3 className="text-2xl font-bold tracking-tight">Pure Content</h3>
             <p className="text-muted-foreground leading-relaxed text-sm">
                We believe in the purity of the document. Our tool is designed to vanish, leaving only your clean information behind.
             </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted px-6 sm:px-12 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-t border-foreground/5 pt-12">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Document Cleaning System v2.0
             </p>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            The Silent Architect &copy; 2026. Built with focus.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
