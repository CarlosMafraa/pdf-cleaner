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
      {/* Header - Editorial Atelier */}
      <div className="flex items-center justify-between px-6 sm:px-12 py-4 bg-muted/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full hover:bg-background/20"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="hidden sm:block">
            <p className="label-sm mb-0.5 text-primary/60">Atelier de Edição</p>
            <div className="flex items-baseline gap-4">
              <h2 className="title-md truncate max-w-sm">
                {file.name}
              </h2>
              <p className="label-sm font-mono opacity-40">
                {pdfInfo.totalPages} PÁG • {Math.round(pdfInfo.width)}×{Math.round(pdfInfo.height)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Navegação de páginas */}
          {pdfInfo.totalPages > 1 && (
            <div className="flex items-center gap-2 bg-muted rounded-full p-1 px-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 rounded-full"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="px-2 label-sm font-mono">
                {currentPage} / {pdfInfo.totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(pdfInfo.totalPages, p + 1))}
                disabled={currentPage === pdfInfo.totalPages}
                className="h-7 w-7 rounded-full"
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
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
        {/* Canvas area (Recessed) */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 sm:p-12 scrollbar-thin" ref={canvasContainerRef}>
          <div className="flex flex-col items-center min-h-full justify-center">
            <div className={cn("flex flex-col sm:flex-row gap-16 items-start", showComparison ? "justify-center" : "justify-center")}>
              {/* Original */}
              <div className="flex flex-col items-center">
                {showComparison && (
                  <p className="label-sm mb-6 text-primary/40 uppercase tracking-[0.2em]">Referência Original</p>
                )}
                
                <div className="relative">
                  <Rulers
                    width={pdfInfo.width}
                    height={pdfInfo.height}
                    scale={zoom}
                    margins={margins}
                  />
                  
                  <div 
                    className="relative canvas-container ambient-shadow"
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
                  <p className="label-sm mb-6 text-primary flex items-center gap-2 uppercase tracking-[0.2em]">
                    <Check size={14} />
                    Resultado Final
                  </p>
                  
                  <div 
                    className="relative canvas-container shadow-2xl ring-1 ring-primary/5"
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

        {/* Sidebar - Organic Editorial (Soft Cream) */}
        <div className="w-full sm:w-80 bg-background flex flex-col h-full border-l border-primary/5 shadow-[-12px_0_40px_rgba(132,83,31,0.03)] relative z-40">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Functional Tabs - 8px Grid Alignment */}
            <div className="flex px-4 py-2 bg-muted/30 m-6 rounded-2xl">
               {[
                 { id: 'settings', label: 'Favoritos' },
                 { id: 'manual', label: 'Manual' }
               ].map((tab) => (
                 <button 
                  key={tab.id}
                  onClick={() => setShowAdvanced(tab.id === 'manual')}
                  className={cn(
                    "flex-1 label-sm lowercase pt-2.5 pb-2 transition-all rounded-xl",
                    (showAdvanced === (tab.id === 'manual')) 
                      ? "bg-card text-primary shadow-sm" 
                      : "text-muted-foreground/50 hover:text-primary/70"
                  )}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 px-8 pb-6 overflow-hidden">
              {/* Contextual Panel - Configuração (Presets) */}
              {!showAdvanced ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="title-md opacity-100">Biblioteca</h3>
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
              ) : (
                /* Contextual Panel - Manual Adjustment */
                <div className="space-y-8 animate-in fade-in duration-300 flex flex-col h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="title-md opacity-100">Ajuste Fino</h3>
                      <Badge variant="secondary" className="bg-primary text-white text-[10px] px-2 py-0 border-none rounded">PT</Badge>
                    </div>
                    
                    {/* Live Metrics - Legibility First (20px) */}
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-muted p-4 rounded-2xl">
                          <p className="label-sm text-[10px] opacity-40 mb-1">Eixo Vertical</p>
                          <p className="text-xl font-bold font-mono text-primary leading-none">
                            {Math.round(margins.top)}<span className="opacity-20 mx-1">/</span>{Math.round(margins.bottom)}
                          </p>
                       </div>
                       <div className="bg-muted p-4 rounded-2xl">
                          <p className="label-sm text-[10px] opacity-40 mb-1">Eixo Horiz</p>
                          <p className="text-xl font-bold font-mono text-primary leading-none">
                            {Math.round(margins.left)}<span className="opacity-20 mx-1">/</span>{Math.round(margins.right)}
                          </p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0 pt-2">
                    <MarginControls
                      margins={margins}
                      onChange={setMargins}
                      pdfDimensions={pdfInfo}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Operations - Anchored Bottom */}
          <div className="p-8 pt-0 mt-auto">
            <div className="p-2 bg-card/40 rounded-[1.25rem] ring-1 ring-primary/5 shadow-xl glass-panel">
              {!showComparison ? (
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full h-14 rounded-xl btn-primary-atelier font-bold tracking-tight shadow-none border-none shrink-0"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="uppercase label-sm tracking-widest text-white leading-none pt-0.5">Limpando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Eye size={20} />
                      <span className="uppercase label-sm tracking-widest text-white leading-none pt-0.5">Pré-Visualização</span>
                    </div>
                  )}
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowComparison(false)}
                    className="w-full h-12 rounded-xl text-primary font-bold tracking-tight hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 label-sm uppercase tracking-widest pt-0.5">
                      <EyeOff size={18} />
                      Voltar ao Ajuste
                    </div>
                  </Button>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full h-14 rounded-xl btn-primary-atelier font-bold tracking-tight shadow-none border-none"
                  >
                    <div className="flex items-center gap-2">
                      <Download size={20} />
                      <span className="uppercase label-sm tracking-widest text-white leading-none pt-0.5">Exportar Arquivo</span>
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
