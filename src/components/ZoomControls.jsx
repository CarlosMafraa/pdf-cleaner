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
      <div className="flex items-center bg-muted p-1 px-2 rounded-full ring-1 ring-primary/5 shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= ZOOM_LEVELS[0]}
              className="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
            >
              <ZoomOut size={14} className="text-primary/60" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Diminuir zoom</TooltipContent>
        </Tooltip>
        
        <span className="px-3 label-sm font-mono text-primary text-center pt-0.5 min-w-[56px] select-none">
          {Math.round(zoom * 100)}%
        </span>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
            >
              <ZoomIn size={14} className="text-primary/60" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Aumentar zoom</TooltipContent>
        </Tooltip>
        
        <div className="w-px h-3 bg-primary/10 mx-2" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFitToScreen}
              className="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
            >
              <Maximize2 size={14} className="text-primary/60" />
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
              className="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
            >
              <Maximize2 size={14} className="rotate-45 text-primary/60" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tela cheia</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
