import { useState, useEffect, useCallback } from 'react'

const DEFAULT_PRESETS = [
  {
    id: 'signature-right',
    name: 'Assinatura Digital (Direita)',
    description: 'Remove a faixa lateral direita comum em documentos assinados',
    margins: { top: 0, bottom: 0, left: 0, right: 25 },
    removeAnnotations: true,
    isDefault: true
  },
  {
    id: 'signature-top-right',
    name: 'Assinatura + Cabeçalho',
    description: 'Remove cabeçalho e faixa lateral direita',
    margins: { top: 30, bottom: 0, left: 0, right: 25 },
    removeAnnotations: true,
    isDefault: true
  },
  {
    id: 'watermark-all',
    name: 'Marca d\'água (Bordas)',
    description: 'Limpa todas as bordas do documento',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    removeAnnotations: false,
    isDefault: true
  },
  {
    id: 'clean-header',
    name: 'Limpar Cabeçalho',
    description: 'Remove apenas a área superior',
    margins: { top: 40, bottom: 0, left: 0, right: 0 },
    removeAnnotations: false,
    isDefault: true
  }
]

const STORAGE_KEY = 'pdf-cleaner-presets'

export function usePresets() {
  const [presets, setPresets] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const customPresets = JSON.parse(stored)
        setPresets([...DEFAULT_PRESETS, ...customPresets])
      } catch {
        setPresets(DEFAULT_PRESETS)
      }
    } else {
      setPresets(DEFAULT_PRESETS)
    }
    setIsLoaded(true)
  }, [])

  const savePresets = useCallback((allPresets) => {
    const customPresets = allPresets.filter(p => !p.isDefault)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets))
  }, [])

  const addPreset = useCallback((preset) => {
    const newPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      isDefault: false
    }
    
    setPresets(prev => {
      const updated = [...prev, newPreset]
      savePresets(updated)
      return updated
    })
    
    return newPreset
  }, [savePresets])

  const deletePreset = useCallback((id) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id || p.isDefault)
      savePresets(updated)
      return updated
    })
  }, [savePresets])

  return {
    presets,
    isLoaded,
    addPreset,
    deletePreset,
    defaultPresets: presets.filter(p => p.isDefault),
    customPresets: presets.filter(p => !p.isDefault)
  }
}
