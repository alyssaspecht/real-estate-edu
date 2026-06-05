declare namespace JSX {
  interface IntrinsicElements {
    'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'stream-type'?: string
      'playback-id'?: string
      style?: React.CSSProperties
      metadata?: Record<string, string>
    }
  }
}
