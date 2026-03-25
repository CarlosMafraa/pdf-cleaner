import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  EyeOff,
  FileSignature,
  Loader2,
  ArrowLeft,
  Check,
  Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Rulers, CropHandles } from './Rulers'
import { ZoomControls } from './ZoomControls'
import { MarginControls } from './MarginControls'
import { PresetSelector, QuickPresets } from './Presets'
import { usePresets } from '@/hooks/usePresets'
import { cn } from '@/lib/utils'

export function PDFEditor({ 
  file, 
  pdfBytes, 
  pdfInfo, 
  onBack, 
  onProcess, 
  processedPdf,
  isProcessing 
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [showComparison, setShowComparison] = useState(false)
  const removeAnnotations = true // Sempre remover por padrão, conforme pedido do usuário
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [margins, setMargins] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 25
  })
  
  const { presets, addPreset, deletePreset } = usePresets()

  // Abre comparação automaticamente quando o PDF processado fica disponível
  useEffect(() => {
    if (processedPdf) setShowComparison(true)
  }, [processedPdf])
  
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const processedCanvasRef = useRef(null)
  const canvasContainerRef = useRef(null)

  const calculateFitScale = useCallback(() => {
    if (!containerRef.current || !pdfInfo) return 1
    const sidebarWidth = 320 // w-80
    const headerHeight = 73
    
    const availableWidth = containerRef.current.offsetWidth - (window.innerWidth > 768 ? sidebarWidth : 0) - 64
    const availableHeight = window.innerHeight - headerHeight - 64
    
    const scaleW = availableWidth / pdfInfo.width
    const scaleH = availableHeight / pdfInfo.height
    
    return Math.min(scaleW, scaleH, 1.5)
  }, [pdfInfo])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Erro ao ativar tela cheia: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    setZoom(calculateFitScale())
  }, [calculateFitScale])

  const [pdf, setPdf] = useState(null)
  const renderTaskRef = useRef(null)

  // Carregar o documento uma única vez
  useEffect(() => {
    let active = true
    if (!pdfBytes) return

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) })
        const loadedPdf = await loadingTask.promise
        if (active) setPdf(loadedPdf)
      } catch (e) {
        console.error('Erro ao carregar documento:', e)
      }
    }

    loadDoc()
    return () => { active = false }
  }, [pdfBytes])

  const renderPage = useCallback(async (loadedPdf, canvas, pageNum, scale) => {
    if (!canvas || !loadedPdf) return
    
    try {
      // Cancelar tarefa anterior se existir e aguardar
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
          await renderTaskRef.current.promise
        } catch (err) {
          // Ignora Erro de Cancelamento
        }
      }

      const page = await loadedPdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const ctx = canvas.getContext('2d')
      const renderContext = {
        canvasContext: ctx,
        viewport
      }

      const task = page.render(renderContext)
      renderTaskRef.current = task
      
      await task.promise
      renderTaskRef.current = null
    } catch (e) {
      if (e.name !== 'RenderingCancelledException') {
        console.error('Erro ao renderizar:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (pdf && canvasRef.current) {
      renderPage(pdf, canvasRef.current, currentPage, zoom)
    }
  }, [pdf, currentPage, zoom, renderPage])

  const [processedPdfDoc, setProcessedPdfDoc] = useState(null)

  useEffect(() => {
    let active = true
    if (!processedPdf) {
      setProcessedPdfDoc(null)
      return
    }

    const loadProcessedDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: processedPdf.slice(0) })
        const loadedPdf = await loadingTask.promise
        if (active) setProcessedPdfDoc(loadedPdf)
      } catch (e) {
        console.error('Erro ao carregar PDF processado:', e)
      }
    }

    loadProcessedDoc()
    return () => { active = false }
  }, [processedPdf])

  useEffect(() => {
    if (processedPdfDoc && processedCanvasRef.current && showComparison) {
      renderPage(processedPdfDoc, processedCanvasRef.current, currentPage, zoom)
    }
  }, [processedPdfDoc, currentPage, zoom, showComparison, renderPage])

  const handleProcess = () => {
    onProcess({ margins, removeAnnotations })
  }

  const handleSelectPreset = (preset) => {
    setMargins(preset.margins)
  }

  const handleFitToScreen = () => {
    setZoom(calculateFitScale())
  }

  const handleDownload = () => {
    const blob = new Blob([processedPdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace('.pdf', '_limpo.pdf')
    a.click()
    URL.revokeObjectURL(url)
  }

  const scaledDimensions = {
    width: pdfInfo.width * zoom,
    height: pdfInfo.height * zoom
  }

  return (
    <div className="h-full flex flex-col bg-background" ref={containerRef}>
      {/* Header - Editorial Shift instead of border */}
      <div className="flex items-center justify-between px-6 sm:px-12 py-4 bg-muted">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full hover:bg-background/50"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="hidden sm:block">
            <p className="label-md mb-0.5">Editing Workspace</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold tracking-tight truncate max-w-xs">
                {file.name}
              </h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                {pdfInfo.totalPages} PAG • {Math.round(pdfInfo.width)} × {Math.round(pdfInfo.height)} PT
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Navegação de páginas */}
          {pdfInfo.totalPages > 1 && (
            <div className="flex items-center gap-2 bg-background/50 rounded-xl p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="px-3 text-[10px] font-bold font-mono tracking-tighter">
                {currentPage} / {pdfInfo.totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(pdfInfo.totalPages, p + 1))}
                disabled={currentPage === pdfInfo.totalPages}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          <ZoomControls 
            zoom={zoom} 
            onZoomChange={setZoom}
            onFitToScreen={handleFitToScreen}
            onFullscreen={toggleFullscreen}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-background p-4 sm:p-12 scrollbar-thin" ref={canvasContainerRef}>
          <div className="flex flex-col items-center min-h-full justify-center">
            <div className={cn("flex flex-col sm:flex-row gap-12 items-start", showComparison ? "justify-center" : "justify-center")}>
              {/* Original */}
              <div className="flex flex-col items-center">
                {showComparison && (
                  <p className="label-md mb-4 tracking-[0.2em]">Original Reference</p>
                )}
                
                <div className="relative">
                  <Rulers
                    width={pdfInfo.width}
                    height={pdfInfo.height}
                    scale={zoom}
                    margins={margins}
                  />
                  
                  <div 
                    className="relative canvas-container surface-lowest"
                    style={{ 
                      marginLeft: 24, 
                      marginTop: 24,
                      width: scaledDimensions.width,
                      height: scaledDimensions.height
                    }}
                  >
                    <canvas ref={canvasRef} className="block" />
                    
                    {!showComparison && (
                      <CropHandles
                        width={pdfInfo.width}
                        height={pdfInfo.height}
                        scale={zoom}
                        margins={margins}
                        onMarginsChange={setMargins}
                        containerRef={canvasContainerRef}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Processado */}
              {showComparison && processedPdfDoc && (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                  <p className="label-md mb-4 text-emerald-600 flex items-center gap-2 tracking-[0.2em]">
                    <Check size={12} />
                    Processed Result
                  </p>
                  
                  <div 
                    className="relative canvas-container surface-lowest ring-1 ring-emerald-500/10"
                    style={{ 
                      width: scaledDimensions.width,
                      height: scaledDimensions.height
                    }}
                  >
                    <canvas ref={processedCanvasRef} className="block" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Surface Container Low */}
        <div className="w-full sm:w-80 bg-muted overflow-y-auto scrollbar-thin shadow-[0_-8px_32px_rgba(0,0,0,0.05)] sm:shadow-none">
          <div className="p-8 space-y-12">
            {/* Instruções */}
            <div>
              <p className="label-md mb-4 text-primary tracking-[0.2em]">Instructions</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adjust the tactile mechanical guides to define your cleanup perimeter. Areas outside the guides will be purged during the export phase.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="label-md text-primary tracking-[0.2em]">Presets</p>
                <PresetSelector
                  presets={presets}
                  currentMargins={margins}
                  onSelectPreset={handleSelectPreset}
                  onSavePreset={addPreset}
                  onDeletePreset={deletePreset}
                />
              </div>
              <QuickPresets presets={presets} onSelect={handleSelectPreset} />
            </div>

            <div className="h-[1px] bg-foreground/5" />

            {/* Ajuste fino */}
            <div className="space-y-4">
               <Button
                variant="ghost"
                className="w-full justify-between p-0 hover:bg-transparent h-auto"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <p className="label-md text-primary tracking-[0.2em]">Mechanical Tuning</p>
                <ChevronRight 
                  size={12} 
                  className={cn("transition-transform text-primary", showAdvanced && "rotate-90")}
                />
              </Button>

              {showAdvanced && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <MarginControls
                    margins={margins}
                    onChange={setMargins}
                    pdfDimensions={pdfInfo}
                  />
                </div>
              )}
            </div>

            {/* Resumo - Silent Architect Card */}
            <div className="surface-lowest p-6 space-y-4">
              <p className="label-md tracking-[0.2em]">Current Metrics</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[10px] font-mono">
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-muted-foreground uppercase opacity-50">Top</span>
                  <span className="font-bold">{Math.round(margins.top)}</span>
                </div>
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-muted-foreground uppercase opacity-50">Base</span>
                  <span className="font-bold">{Math.round(margins.bottom)}</span>
                </div>
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-muted-foreground uppercase opacity-50">Left</span>
                  <span className="font-bold">{Math.round(margins.left)}</span>
                </div>
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-muted-foreground uppercase opacity-50">Right</span>
                  <span className="font-bold">{Math.round(margins.right)}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-8 space-y-4">
              {!showComparison ? (
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold tracking-tight shadow-none"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="uppercase text-[10px] tracking-widest">Architecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Eye size={20} />
                      <span className="uppercase text-[10px] tracking-widest">Preview Architecture</span>
                    </div>
                  )}
                </Button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <Button
                    variant="secondary"
                    onClick={() => setShowComparison(false)}
                    className="w-full h-14 rounded-2xl bg-background hover:bg-muted font-bold tracking-tight text-foreground shadow-none"
                  >
                    <div className="flex items-center gap-3">
                      <EyeOff size={20} />
                      <span className="uppercase text-[10px] tracking-widest text-primary">Back to Drafting</span>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full h-14 rounded-2xl bg-foreground text-background hover:opacity-90 font-bold tracking-tight shadow-none transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={20} />
                      <span className="uppercase text-[10px] tracking-widest">Export Archive</span>
                    </div>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
