import React from 'react'

/**
 * AegisGradient: Elemento de luz volumétrica.
 * Agora com opacidade e cores ajustadas para serem VISÍVEIS e IMPACTANTES.
 */
export function AegisGradient({
  className = "",
  intensity = "medium",
  position = "absolute"
}: {
  className?: string,
  intensity?: 'low' | 'medium' | 'high',
  position?: 'absolute' | 'relative'
}) {
  const colors = {
    low: 'bg-blue-900/30',
    medium: 'bg-blue-600/50',
    high: 'bg-blue-500/70'
  }

  return (
    <div
      className={`${position} ${className} pointer-events-none rounded-full blur-[120px] ${colors[intensity]}`}
      style={{
        mixBlendMode: 'screen',
        transition: 'all 3s ease-in-out'
      }}
    />
  )
}
