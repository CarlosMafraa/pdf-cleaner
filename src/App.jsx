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
      {/* Header - Editorial Atelier Branding */}
      <header className="px-6 sm:px-12 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-2xl shadow-lg rotate-3">
              <FileText size={20} className="text-white -rotate-3" />
            </div>
            <div className="flex flex-col">
              <p className="label-sm font-bold tracking-[0.4em] text-primary uppercase leading-none">
                PDF CLEANER
              </p>
              <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1">PRO EDITION v2.0</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 w-full">
        {/* Hero Section - High-End Editorial */}
        <section className="pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            {/* Left Column: Context */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <h1 className="display-sm text-primary leading-[1.1]">
                Limpeza Profissional <br/>
                <span className="opacity-40 italic">de Documentos.</span>
              </h1>
              <p className="body-large max-w-lg opacity-70">
                Uma ferramenta web dedicada à restauração de PDFs. Remova assinaturas, marcas d'água e elementos indesejados através de uma interface de precisão inspirada em ateliês de design.
              </p>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">PDF</div>
                  ))}
                </div>
                <p className="label-sm text-primary/60 italic">+12k documentos processados localmente</p>
              </div>
            </div>

            {/* Right Column: Interactive Dropzone */}
            <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="absolute -inset-10 bg-primary/2 rounded-[3rem] -z-10 blur-3xl opacity-50" />
              <div className="bg-card rounded-[2.5rem] p-8 sm:p-12 shadow-[0_32px_64px_rgba(132,83,31,0.06)] ring-1 ring-primary/5">
                <FileUploader 
                  onFilesSelected={handleFilesSelected}
                  multiple={true}
                />
                
                {files.length > 0 && (
                  <div className="mt-10 pt-10 border-t border-primary/5">
                    <FileList files={files} onRemove={handleRemoveFile} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features - Tonal Contrast */}
        <div className="grid md:grid-cols-2 gap-12 py-32 border-t border-primary/5">
           {/* Section 1: Capabilities */}
           <section className="space-y-12">
              <div className="space-y-4">
                <h2 className="title-md text-primary font-bold uppercase tracking-[0.2em]">Funcionalidades</h2>
                <div className="h-0.5 w-12 bg-primary/20" />
              </div>
              
              <div className="grid sm:grid-cols-1 gap-10">
                 {[
                   { icon: FileText, title: "Limpeza de Camadas", desc: "Identifica e neutraliza assinaturas digitais e anotações nativas." },
                   { icon: Ruler, title: "Corte de Precisão", desc: "Réguas milimétricas para definir o perímetro exato de exibição." },
                   { icon: Shield, title: "Segurança Absoluta", desc: "Processamento síncrono no navegador. Seus dados nunca saem da máquina." }
                 ].map((feat, i) => (
                   <div key={i} className="flex gap-8 items-start group">
                      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                         <feat.icon size={20} className="transition-colors" />
                      </div>
                      <div className="pt-1.5">
                         <h3 className="title-md text-foreground mb-2">{feat.title}</h3>
                         <p className="body-md opacity-60 leading-relaxed">{feat.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Section 2: Values */}
           <section className="bg-muted p-12 rounded-[2.5rem] space-y-12">
              <div className="space-y-4">
                <h2 className="title-md text-primary font-bold uppercase tracking-[0.2em]">O Compromisso</h2>
                <div className="h-0.5 w-12 bg-primary/20" />
              </div>

              <div className="space-y-8">
                 {[
                   { title: "Soberania de Dados", desc: "Todo o processamento ocorre no seu hardware local." },
                   { title: "Acesso Livre", desc: "Sem assinaturas, sem logins, sem interrupções." },
                   { title: "Interface Editorial", desc: "Design focado em legibilidade e redução de fadiga visual." }
                 ].map((diff, i) => (
                   <div key={i} className="flex gap-6 items-start">
                      <div className="pt-1.5">
                         <h3 className="title-md text-foreground mb-2 flex items-center gap-3">
                           <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                           {diff.title}
                         </h3>
                         <p className="body-md opacity-60 leading-relaxed pl-4.5">{diff.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </main>

      {/* Footer - Subtle */}
      <footer className="px-6 sm:px-12 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-t border-primary/5">
          <p className="label-sm text-primary/40 font-bold uppercase tracking-widest">
            PDF Cleaner Pro &copy; 2026. Design in Organic Editorial.
          </p>
          <div className="flex gap-8">
            <span className="label-sm text-primary/20 uppercase tracking-widest">v2.0.4 - Alpha</span>
            <span className="label-sm text-primary/20 uppercase tracking-widest">Sem Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
