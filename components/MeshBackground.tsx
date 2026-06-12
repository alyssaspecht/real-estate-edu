'use client'

export function MeshBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Orb 1 — electric blue, top-left */}
      <div className="mesh-orb mesh-orb-1" />
      {/* Orb 2 — indigo/purple, bottom-right */}
      <div className="mesh-orb mesh-orb-2" />
      {/* Orb 3 — teal, center */}
      <div className="mesh-orb mesh-orb-3" />
      {/* Orb 4 — deep blue, top-right */}
      <div className="mesh-orb mesh-orb-4" />

      {/* Subtle noise/grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
    </div>
  )
}
