import React from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PresetList({ presets, onSelect, onDelete }) {
  if (presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-2xl border border-dashed border-primary/10">
        <Bookmark size={24} className="text-primary/20 mb-3" />
        <p className="label-sm text-primary/40 uppercase tracking-widest">Nenhuma configuração slva</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {presets.map(preset => {
        return (
          <div
            key={preset.id}
            className="group flex flex-col p-4 rounded-xl hover:bg-muted transition-all ring-1 ring-transparent hover:ring-primary/5 cursor-pointer"
            onClick={() => onSelect(preset)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {preset.name}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider leading-relaxed">
                  {preset.description}
                </p>
              </div>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(preset.id)
                  }}
                  className="p-2 rounded-lg text-primary/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


