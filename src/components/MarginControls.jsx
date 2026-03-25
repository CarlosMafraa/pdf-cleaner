import React from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function MarginControls({ margins, onChange, pdfDimensions }) {
  const handleChange = (side, value) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    const maxValue = side === 'top' || side === 'bottom' 
      ? pdfDimensions.height / 2 
      : pdfDimensions.width / 2
    
    onChange({
      ...margins,
      [side]: Math.min(numValue, maxValue)
    })
  }

  const handleReset = () => {
    onChange({ top: 0, bottom: 0, left: 0, right: 0 })
  }

  const MarginInput = ({ side, icon: Icon, label }) => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 min-w-[70px]">
        <Icon size={14} className="text-primary opacity-40" />
        <span className="label-md opacity-60 text-[10px]">{label}</span>
      </div>
      <div className="relative flex-1">
        <Input
          type="number"
          value={Math.round(margins[side])}
          onChange={(e) => handleChange(side, e.target.value)}
          className="h-10 text-xs pr-8 font-mono bg-background border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
          min="0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest pointer-events-none">
          PT
        </span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="label-md tracking-[0.2em] text-primary uppercase">Ajuste Fino</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 text-[10px] gap-2 uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <RotateCcw size={12} />
          Resetar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <MarginInput side="top" icon={ArrowUp} label="Topo" />
        <MarginInput side="bottom" icon={ArrowDown} label="Base" />
        <MarginInput side="left" icon={ArrowLeft} label="Esq." />
        <MarginInput side="right" icon={ArrowRight} label="Dir." />
      </div>

      {/* Visual Tuning Reference */}
      <div className="mt-8 p-6 surface-lowest rounded-2xl">
        <div className="relative w-full aspect-[3/4] max-w-[120px] mx-auto bg-muted rounded-lg overflow-hidden ring-1 ring-foreground/5 transition-all duration-500">
          {margins.top > 0 && (
            <div 
              className="absolute top-0 left-0 right-0 bg-primary/10 border-b border-primary/20 transition-all duration-300"
              style={{ height: `${Math.min(margins.top / 8, 45)}%` }}
            />
          )}
          {margins.bottom > 0 && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-primary/10 border-t border-primary/20 transition-all duration-300"
              style={{ height: `${Math.min(margins.bottom / 8, 45)}%` }}
            />
          )}
          {margins.left > 0 && (
            <div 
              className="absolute top-0 bottom-0 left-0 bg-primary/10 border-r border-primary/20 transition-all duration-300"
              style={{ width: `${Math.min(margins.left / 6, 45)}%` }}
            />
          )}
          {margins.right > 0 && (
            <div 
              className="absolute top-0 bottom-0 right-0 bg-primary/10 border-l border-primary/20 transition-all duration-300"
              style={{ width: `${Math.min(margins.right / 6, 45)}%` }}
            />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="label-md opacity-20 tracking-[0.3em] uppercase">Arquivo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
