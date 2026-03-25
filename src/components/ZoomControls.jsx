import React from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function ZoomControls({ zoom, onZoomChange, onFitToScreen, onFullscreen }) {
  const currentIndex = ZOOM_LEVELS.findIndex(z => z >= zoom)
  
  const handleZoomIn = () => {
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1)
    onZoomChange(ZOOM_LEVELS[nextIndex])
  }
  
  const handleZoomOut = () => {
    const prevIndex = Math.max(currentIndex - 1, 0)
    onZoomChange(ZOOM_LEVELS[prevIndex])
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-background/50 rounded-xl p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_LEVELS[0]}
              className="h-8 w-8 rounded-lg"
            >
              <ZoomOut size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Diminuir zoom</TooltipContent>
        </Tooltip>
        
        <span className="px-1 text-[10px] font-bold font-mono tracking-tighter min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="h-8 w-8 rounded-lg"
            >
              <ZoomIn size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Aumentar zoom</TooltipContent>
        </Tooltip>
        
        <div className="w-[1px] h-3 bg-foreground/10 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFitToScreen}
              className="h-8 w-8 rounded-lg"
            >
              <Maximize2 size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ajustar à tela</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFullscreen}
              className="h-8 w-8 rounded-lg"
            >
              <Maximize2 size={16} className="rotate-45" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tela cheia</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
