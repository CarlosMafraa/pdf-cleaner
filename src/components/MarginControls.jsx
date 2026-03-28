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
      <div className="flex items-center gap-3 min-w-[80px]">
        <Icon size={16} className="text-primary/40" />
        <span className="label-sm text-primary/60 uppercase pt-0.5">{label}</span>
      </div>
      <div className="relative flex-1">
        <Input
          type="number"
          value={Math.round(margins[side])}
          onChange={(e) => handleChange(side, e.target.value)}
          className="h-12 text-base pr-10 font-mono bg-muted border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/10 transition-shadow"
          min="0"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/20 uppercase tracking-widest pointer-events-none">
          PT
        </span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col pt-2">
      <div className="pb-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <MarginInput side="top" icon={ArrowUp} label="Topo" />
          <MarginInput side="bottom" icon={ArrowDown} label="Base" />
          <MarginInput side="left" icon={ArrowLeft} label="Esq." />
          <MarginInput side="right" icon={ArrowRight} label="Dir." />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 px-4 rounded-xl label-sm lowercase gap-2 text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <RotateCcw size={14} />
            limpar ajustes
          </Button>
        </div>
      </div>

      {/* Visual Tuning Reference - Editorial Mirror */}
      <div className="pt-4 border-t border-primary/5 mt-4">
        <div className="relative w-full aspect-[4/5] max-w-[140px] min-h-[160px] mx-auto bg-muted rounded-[2rem] overflow-hidden ring-1 ring-primary/5 transition-all duration-700 shadow-inner">
          <div className="absolute inset-4 border border-primary/5 rounded-2xl opacity-50" />
          
          {margins.top > 0 && (
            <div 
              className="absolute top-0 left-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
              style={{ height: `${Math.min(margins.top / 8, 48)}%` }}
            />
          )}
          {margins.bottom > 0 && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
              style={{ height: `${Math.min(margins.bottom / 8, 48)}%` }}
            />
          )}
          {margins.left > 0 && (
            <div 
              className="absolute top-0 bottom-0 left-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
              style={{ width: `${Math.min(margins.left / 6, 48)}%` }}
            />
          )}
          {margins.right > 0 && (
            <div 
              className="absolute top-0 bottom-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
              style={{ width: `${Math.min(margins.right / 6, 48)}%` }}
            />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="label-sm opacity-10 tracking-[0.4em] uppercase text-[10px] select-none">Editorial</span>
          </div>
        </div>
      </div>
    </div>
  )
}
