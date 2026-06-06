'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
    >
      🖨 Print Certificate
    </button>
  )
}
