import React, { useState, useCallback } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { FileText, Shield, Zap, Ruler, Check } from 'lucide-react'
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Compact */}
      <header className="bg-muted px-6 sm:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-lg">
              <FileText size={16} className="text-primary-foreground" />
            </div>
            <p className="label-md font-bold tracking-[0.2em] text-foreground uppercase pt-0.5">
              PDF CLEANER PRO
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 w-full">
        {/* Simplified Hero Section */}
        <section className="pt-12 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left Column: Context */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter leading-none text-foreground">
                PDF Cleaner Pro
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Uma ferramenta web para limpeza de documentos PDF. Remova assinaturas digitais, marcas d'água e bordas indesejadas usando réguas interativas diretamente sobre o documento.
              </p>
            </div>

            {/* Right Column: Interactive Dropzone */}
            <div className="relative">
              <div className="absolute -inset-4 bg-muted rounded-[2.5rem] -z-10" />
              <div className="bg-background rounded-3xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(45,52,53,0.06)] ring-1 ring-foreground/[0.03]">
                <FileUploader 
                  onFilesSelected={handleFilesSelected}
                  multiple={true}
                />
                
                {files.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-muted">
                    <FileList files={files} onRemove={handleRemoveFile} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Dual Cards - Prominent Symmetric Titles */}
        <div className="grid md:grid-cols-2 gap-8 pb-40 py-24">
           {/* O que faz - Card */}
           <section className="bg-muted px-10 py-12 rounded-2xl space-y-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Funcionalidades</h2>
              <div className="space-y-8">
                 {[
                   { icon: FileText, title: "Assinaturas", desc: "Elimina anotações de assinatura digital" },
                   { icon: Ruler, title: "Bordas", desc: "Réguas para definir corte em topo e laterais" },
                   { icon: Shield, title: "Local", desc: "100% no navegador, sem upload para servidores" }
                 ].map((feat, i) => (
                   <div key={i} className="flex gap-6 items-start group">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-105">
                         <feat.icon size={18} className="text-primary" />
                      </div>
                      <div className="pt-0.5">
                         <h3 className="font-bold text-sm text-foreground mb-1">{feat.title}</h3>
                         <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Diferenciais - Card */}
           <section className="bg-muted px-10 py-12 rounded-2xl space-y-12">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Diferenciais</h2>
              <div className="space-y-8">
                 {[
                   { icon: Check, title: "Privacidade", desc: "Processamento 100% local no navegador" },
                   { icon: Check, title: "Custo Zero", desc: "Sem limites de uso ou assinaturas mensais" },
                   { icon: Check, title: "Nativo", desc: "Interface intuitiva inspirada em ferramentas de design" },
                   { icon: Check, title: "Prático", desc: "Hospedagem simples, rápida e gratuita" }
                 ].map((diff, i) => (
                   <div key={i} className="flex gap-6 items-start group">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-105">
                         <diff.icon size={18} className="text-primary" />
                      </div>
                      <div className="pt-0.5">
                         <h3 className="font-bold text-sm text-foreground mb-1">{diff.title}</h3>
                         <p className="text-xs text-muted-foreground leading-relaxed">{diff.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="bg-muted px-6 sm:px-12 py-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-t border-foreground/5 pt-8">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            PDF Cleaner Pro &copy; 2026. Processamento Local e Gratuito.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
