import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export function Rulers({ width, height, scale, margins }) {
  const rulerSize = 24
  
  const renderHorizontalMarks = () => {
    const marks = []
    const step = scale > 0.5 ? 50 : 100
    
    for (let i = 0; i <= width; i += step) {
      const x = i * scale
      const isMajor = i % (step * 2) === 0
      
      marks.push(
        <g key={`h-${i}`}>
          <line
            x1={x}
            y1={isMajor ? 8 : 14}
            x2={x}
            y2={rulerSize}
            stroke="currentColor"
            strokeWidth={1}
            className="text-primary/40"
          />
          {isMajor && (
            <text
              x={x + 3}
              y={12}
              fontSize="9"
              fill="currentColor"
              className="text-primary/70 font-mono"
            >
              {Math.round(i)}
            </text>
          )}
        </g>
      )
    }
    
    return marks
  }

  const renderVerticalMarks = () => {
    const marks = []
    const step = scale > 0.5 ? 50 : 100
    
    for (let i = 0; i <= height; i += step) {
      const y = i * scale
      const isMajor = i % (step * 2) === 0
      
      marks.push(
        <g key={`v-${i}`}>
          <line
            x1={isMajor ? 8 : 14}
            y1={y}
            x2={rulerSize}
            y2={y}
            stroke="currentColor"
            strokeWidth={1}
            className="text-primary/40"
          />
          {isMajor && (
            <text
              x={4}
              y={y + 3}
              fontSize="9"
              fill="currentColor"
              className="text-primary/70 font-mono"
              transform={`rotate(-90, 4, ${y})`}
            >
              {Math.round(i)}
            </text>
          )}
        </g>
      )
    }
    
    return marks
  }

  return (
    <div className="relative select-none">
      {/* Canto - Editorial Indicator */}
      <div 
        className="absolute top-0 left-0 bg-muted flex items-center justify-center"
        style={{ width: rulerSize, height: rulerSize }}
      >
        <span className="label-md opacity-40">PT</span>
      </div>
      
      {/* Régua horizontal */}
      <div 
        className="absolute top-0 bg-background overflow-hidden"
        style={{ left: rulerSize, height: rulerSize, width: width * scale }}
      >
        <svg width={width * scale} height={rulerSize}>
          {renderHorizontalMarks()}
        </svg>
        
        {margins.left > 0 && (
          <div 
            className="absolute top-0 bottom-0 bg-primary/5"
            style={{ left: 0, width: margins.left * scale }}
          >
             <div className="absolute right-0 w-[1px] h-full bg-primary/20" />
          </div>
        )}
        {margins.right > 0 && (
          <div 
            className="absolute top-0 bottom-0 bg-primary/5"
            style={{ right: 0, width: margins.right * scale }}
          >
             <div className="absolute left-0 w-[1px] h-full bg-primary/20" />
          </div>
        )}
      </div>
      
      {/* Régua vertical */}
      <div 
        className="absolute left-0 bg-background overflow-hidden"
        style={{ top: rulerSize, width: rulerSize, height: height * scale }}
      >
        <svg width={rulerSize} height={height * scale}>
          {renderVerticalMarks()}
        </svg>
        
        {margins.top > 0 && (
          <div 
            className="absolute left-0 right-0 bg-primary/5"
            style={{ top: 0, height: margins.top * scale }}
          >
             <div className="absolute bottom-0 w-full h-[1px] bg-primary/20" />
          </div>
        )}
        {margins.bottom > 0 && (
          <div 
            className="absolute left-0 right-0 bg-primary/5"
            style={{ bottom: 0, height: margins.bottom * scale }}
          >
             <div className="absolute top-0 w-full h-[1px] bg-primary/20" />
          </div>
        )}
      </div>
    </div>
  )
}

export function CropHandles({ width, height, scale, margins, onMarginsChange, containerRef }) {
  const [dragging, setDragging] = useState(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startMargins, setStartMargins] = useState(margins)

  const handleMouseDown = (edge) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(edge)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartMargins({ ...margins })
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y
    const minSize = 50

    const newMargins = { ...startMargins }

    switch (dragging) {
      case 'top':
        newMargins.top = Math.max(0, Math.min(
          height - margins.bottom - minSize,
          startMargins.top + deltaY / scale
        ))
        break
      case 'bottom':
        newMargins.bottom = Math.max(0, Math.min(
          height - margins.top - minSize,
          startMargins.bottom - deltaY / scale
        ))
        break
      case 'left':
        newMargins.left = Math.max(0, Math.min(
          width - margins.right - minSize,
          startMargins.left + deltaX / scale
        ))
        break
      case 'right':
        newMargins.right = Math.max(0, Math.min(
          width - margins.left - minSize,
          startMargins.right - deltaX / scale
        ))
        break
    }

    onMarginsChange(newMargins)
  }, [dragging, startPos, startMargins, scale, width, height, margins, onMarginsChange])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const scaledMargins = {
    top: margins.top * scale,
    bottom: margins.bottom * scale,
    left: margins.left * scale,
    right: margins.right * scale
  }

  return (
    <>
      {/* Overlays */}
      {margins.top > 0 && (
        <div className="ruler-overlay" style={{ top: 0, left: 0, right: 0, height: scaledMargins.top }} />
      )}
      {margins.bottom > 0 && (
        <div className="ruler-overlay" style={{ bottom: 0, left: 0, right: 0, height: scaledMargins.bottom }} />
      )}
      {margins.left > 0 && (
        <div className="ruler-overlay" style={{ top: scaledMargins.top, left: 0, bottom: scaledMargins.bottom, width: scaledMargins.left }} />
      )}
      {margins.right > 0 && (
        <div className="ruler-overlay" style={{ top: scaledMargins.top, right: 0, bottom: scaledMargins.bottom, width: scaledMargins.right }} />
      )}

      {/* Handles - Silent Architect Subtle Guides */}
      <div
        onMouseDown={handleMouseDown('top')}
        className={cn("ruler-handle cursor-ns-resize", dragging === 'top' ? 'opacity-100' : 'opacity-40')}
        style={{
          position: 'absolute',
          top: scaledMargins.top - 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 4,
          zIndex: 20
        }}
      />
      
      <div
        onMouseDown={handleMouseDown('bottom')}
        className={cn("ruler-handle cursor-ns-resize", dragging === 'bottom' ? 'opacity-100' : 'opacity-40')}
        style={{
          position: 'absolute',
          bottom: scaledMargins.bottom - 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 4,
          zIndex: 20
        }}
      />
      
      <div
        onMouseDown={handleMouseDown('left')}
        className={cn("ruler-handle cursor-ew-resize", dragging === 'left' ? 'opacity-100' : 'opacity-40')}
        style={{
          position: 'absolute',
          left: scaledMargins.left - 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4,
          height: 60,
          zIndex: 20
        }}
      />
      
      <div
        onMouseDown={handleMouseDown('right')}
        className={cn("ruler-handle cursor-ew-resize", dragging === 'right' ? 'opacity-100' : 'opacity-40')}
        style={{
          position: 'absolute',
          right: scaledMargins.right - 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4,
          height: 60,
          zIndex: 20
        }}
      />
      
      {/* Measurements - Minimal Editorial Style */}
      {margins.top > 20 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 label-md text-primary opacity-60 z-30"
          style={{ top: scaledMargins.top / 2 - 8 }}
        >
          {Math.round(margins.top)}
        </div>
      )}
      {margins.bottom > 20 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 label-md text-primary opacity-60 z-30"
          style={{ bottom: scaledMargins.bottom / 2 - 8 }}
        >
          {Math.round(margins.bottom)}
        </div>
      )}
      {margins.left > 20 && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 label-md text-primary opacity-60 z-30"
          style={{ left: scaledMargins.left / 2 - 12 }}
        >
          {Math.round(margins.left)}
        </div>
      )}
      {margins.right > 20 && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 label-md text-primary opacity-60 z-30"
          style={{ right: scaledMargins.right / 2 - 12 }}
        >
          {Math.round(margins.right)}
        </div>
      )}
    </>
  )
}
