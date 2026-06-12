'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  lessonId: string
  lessonTitle: string
}

export function CourseAssistant({ lessonId, lessonTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      // Welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI course assistant for this lesson. Ask me anything about **${lessonTitle}** and I'll help you understand the material. 🎓`,
      }])
    }
  }, [open, lessonTitle, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamingText('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/course-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          messages: newMessages,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }))
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I ran into an error: ${err.error ?? 'Please try again.'}`,
        }])
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreamingText(accumulated)
      }

      // Commit the full streamed message
      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
      setStreamingText('')
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([])
    setStreamingText('')
  }

  const displayMessages = streamingText
    ? [...messages, { role: 'assistant' as const, content: streamingText }]
    : messages

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
          open
            ? 'bg-muted border border-border text-muted-foreground hover:bg-secondary'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-blue'
        }`}
        title={open ? 'Close AI Assistant' : 'Ask AI Assistant'}
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[calc(100vh-8rem)] flex flex-col glass-card rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">AI Assistant</p>
                <p className="text-xs text-muted-foreground">Powered by Claude</p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Clear chat"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[420px]">
            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}
                >
                  <MessageContent content={msg.content} />
                  {i === displayMessages.length - 1 && msg.role === 'assistant' && loading && (
                    <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this lesson..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-h-[38px] max-h-[100px] overflow-y-auto"
                style={{ lineHeight: '1.4' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send message"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  )
}

// Renders markdown-style bold (**text**) and line breaks
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ))
      })}
    </span>
  )
}
