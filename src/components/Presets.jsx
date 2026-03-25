import React, { useState } from 'react'
import { Bookmark, Plus, Trash2, Check, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

export function PresetSelector({ 
  presets, 
  currentMargins, 
  onSelectPreset, 
  onSavePreset,
  onDeletePreset 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  const handleSelectPreset = (preset) => {
    onSelectPreset(preset)
    setIsOpen(false)
  }

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onSavePreset({
        name: newPresetName.trim(),
        description: 'Preset personalizado',
        margins: currentMargins,
      })
      setNewPresetName('')
      setIsSaving(false)
    }
  }

  const defaultPresets = presets.filter(p => p.isDefault)
  const customPresets = presets.filter(p => !p.isDefault)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="w-full justify-between bg-background border-none hover:bg-muted text-primary font-bold h-11 px-4 rounded-xl">
          <span className="flex items-center gap-3">
            <Bookmark size={18} />
            <span className="uppercase text-[10px] tracking-widest">Favoritos</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 surface-lowest border-none" align="end">
        {/* Presets padrão */}
        <div className="p-4">
          <p className="label-md mb-4 text-primary opacity-50 px-2 tracking-[0.2em] uppercase">Padrões do Sistema</p>
          <div className="space-y-1">
            {defaultPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="w-full text-left px-3 py-3 rounded-xl hover:bg-muted transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-tight text-foreground">
                    {preset.name}
                  </span>
                  <Sparkles size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Presets customizados */}
        {customPresets.length > 0 && (
          <div className="p-4 pt-0">
            <p className="label-md mb-4 text-primary opacity-50 px-2 tracking-[0.2em] uppercase">Arquivo pessoal</p>
            <div className="space-y-1">
              {customPresets.map(preset => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted transition-all group"
                >
                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className="flex-1 text-left"
                  >
                    <span className="font-bold text-sm tracking-tight text-foreground">
                      {preset.name}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeletePreset(preset.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salvar novo preset */}
        <div className="p-4 pt-0">
          <div className="h-px bg-foreground/5 mb-4" />
          {isSaving ? (
            <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Nomear estado atual..."
                className="h-9 text-xs flex-1 border-none bg-transparent focus-visible:ring-0"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg"
              >
                <Check size={18} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsSaving(false)}
                className="h-8 w-8 rounded-lg"
              >
                <X size={18} />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsSaving(true)}
              className="w-full justify-center gap-3 text-primary h-11 rounded-xl hover:bg-muted font-bold"
            >
              <Plus size={18} />
              <span className="uppercase text-[10px] tracking-widest">Salvar Configuração</span>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function QuickPresets({ presets, onSelect }) {
  const defaultPresets = presets.filter(p => p.isDefault).slice(0, 4)
  
  return (
    <div className="flex flex-wrap gap-2">
      {defaultPresets.map(preset => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset)}
          className="bg-background text-foreground/70 hover:text-primary hover:bg-white px-4 py-2 rounded-full transition-all text-[11px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md"
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
