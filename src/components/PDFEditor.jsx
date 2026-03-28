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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Rulers, CropHandles } from './Rulers'
import { ZoomControls } from './ZoomControls'
import { MarginControls } from './MarginControls'
import { PresetList } from './Presets'
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
  const [activeTab, setActiveTab] = useState('automatico')
  const [newPresetName, setNewPresetName] = useState('')
  
  const [margins, setMargins] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 25
  })
  
  const { defaultPresets, customPresets, addPreset, deletePreset } = usePresets()

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      addPreset({
        name: newPresetName.trim(),
        description: 'Configuração Personalizada',
        margins: margins,
        removeAnnotations,
      })
      setNewPresetName('')
      setActiveTab('automatico')
    }
  }

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
          
          <div className="flex items-center gap-2 pl-4 border-l border-primary/10">
            {!showComparison ? (
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="h-10 px-6 rounded-full btn-primary-atelier font-bold shadow-none border-none shrink-0"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="uppercase text-[11px] tracking-widest text-white leading-none pt-0.5">Limpando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span className="uppercase text-[11px] tracking-widest text-white leading-none pt-0.5">Visualizar</span>
                  </div>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowComparison(false)}
                  className="h-10 px-4 rounded-full text-primary font-bold hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 uppercase text-[11px] tracking-widest pt-0.5">
                    <EyeOff size={16} />
                    Voltar
                  </div>
                </Button>
                
                <Button
                  onClick={handleDownload}
                  className="h-10 px-6 rounded-full btn-primary-atelier font-bold shadow-none border-none"
                >
                  <div className="flex items-center gap-2">
                    <Download size={16} />
                    <span className="uppercase text-[11px] tracking-widest text-white leading-none pt-0.5">Exportar Arquivo</span>
                  </div>
                </Button>
              </>
            )}
          </div>
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
        <div className="w-full sm:w-80 bg-background h-full border-l border-primary/5 shadow-[-12px_0_40px_rgba(132,83,31,0.03)] relative z-40 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col min-h-full">
            {/* Functional Tabs - 8px Grid Alignment */}
            <div className="flex px-4 py-2 bg-muted/30 m-6 rounded-2xl shrink-0">
               {[
                 { id: 'automatico', label: 'Automático' },
                 { id: 'manual', label: 'Manual' }
               ].map((tab) => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 label-sm lowercase pt-2.5 pb-2 transition-all rounded-xl",
                    (activeTab === tab.id) 
                      ? "bg-card text-primary shadow-sm" 
                      : "text-muted-foreground/50 hover:text-primary/70"
                  )}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 px-8 pb-8 flex flex-col">
              {/* Contextual Panel - Configuração (Presets) */}
              {activeTab === 'automatico' && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-6">
                    <p className="label-sm mb-4 text-primary opacity-50 px-1 tracking-[0.2em] uppercase">Padrões do Sistema</p>
                    <PresetList 
                      presets={defaultPresets} 
                      onSelect={handleSelectPreset}
                    />
                  </div>
                  
                  <div className="pt-6 border-t border-primary/5">
                    <h3 className="title-md opacity-100 mb-4 px-1">Minhas Configurações</h3>
                    <PresetList 
                      presets={customPresets} 
                      onSelect={handleSelectPreset}
                      onDelete={deletePreset}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="animate-in fade-in duration-300 flex flex-col flex-1">
                  <div className="space-y-4 shrink-0 mb-6">
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
                  
                  <div className="flex-1 flex flex-col">
                    <MarginControls
                      margins={margins}
                      onChange={setMargins}
                      pdfDimensions={pdfInfo}
                    />
                  </div>
                  
                  {/* Save custom preset section */}
                  <div className="pt-6 mt-4 border-t border-primary/5 shrink-0 space-y-3">
                    <p className="label-sm text-primary opacity-50 px-1 tracking-[0.2em] uppercase">Salvar como Predefinição</p>
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-xl">
                      <Input
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="Nome da configuração..."
                        className="h-10 text-sm flex-1 border-none bg-transparent focus-visible:ring-0"
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                      />
                      <Button
                        variant="ghost"
                        onClick={handleSavePreset}
                        disabled={!newPresetName.trim()}
                        className="h-10 px-4 text-emerald-600 hover:bg-emerald-50 rounded-lg label-sm lowercase gap-2"
                      >
                        <Check size={16} /> salvar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
