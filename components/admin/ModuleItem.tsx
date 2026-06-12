'use client'

import { useState } from 'react'
import { VideoUploader } from './VideoUploader'

type Lesson = { id: string; title: string; type: string; position: number; videoPlaybackId?: string | null; isFreePreview?: boolean }
type Module = { id: string; title: string; position: number; lessons: Lesson[] }

type Props = {
  module: Module
  index: number
  total: number
  onDelete: () => void
  onUpdateTitle: (title: string) => void
  onAddLesson: (title: string, type: string) => void
  onDeleteLesson: (lessonId: string) => void
  onMove: (dir: 'up' | 'down') => void
}

const lessonTypeIcons: Record<string, string> = {
  VIDEO: '🎬',
  TEXT: '📝',
  RESOURCE: '📎',
}

function LessonRow({ lesson, onDelete }: { lesson: Lesson; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [expanded, setExpanded] = useState(false)
  const [playbackId, setPlaybackId] = useState(lesson.videoPlaybackId ?? null)
  const [isPreview, setIsPreview] = useState(lesson.isFreePreview ?? false)

  const togglePreview = async () => {
    const next = !isPreview
    setIsPreview(next)
    await fetch(`/api/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFreePreview: next }),
    })
  }

  const save = async () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== lesson.title) {
      await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
    } else {
      setTitle(lesson.title)
    }
    setEditing(false)
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 px-6 py-3 hover:bg-muted">
        <span className="text-sm">{lessonTypeIcons[lesson.type] ?? '📄'}</span>
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 text-sm text-foreground cursor-pointer hover:text-primary"
            onClick={() => setEditing(true)}
          >
            {title}
          </span>
        )}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {lesson.type}
        </span>
        <button
          onClick={togglePreview}
          className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
            isPreview
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-muted text-muted-foreground hover:bg-muted'
          }`}
        >
          {isPreview ? 'Free Preview ✓' : 'Preview'}
        </button>
        {lesson.type === 'VIDEO' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? 'Close' : playbackId ? 'Replace video' : 'Upload video'}
          </button>
        )}
        <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">
          Delete
        </button>
      </div>

      {/* Video upload panel */}
      {expanded && lesson.type === 'VIDEO' && (
        <div className="px-6 pb-4 bg-gray-50">
          <VideoUploader
            lessonId={lesson.id}
            currentPlaybackId={playbackId}
            onUploadComplete={(id) => {
              setPlaybackId(id)
              setExpanded(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

export function ModuleItem({
  module, index, total, onDelete, onUpdateTitle,
  onAddLesson, onDeleteLesson, onMove
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(module.title)
  const [showNewLesson, setShowNewLesson] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonType, setNewLessonType] = useState('VIDEO')
  const [addingLesson, setAddingLesson] = useState(false)

  const saveTitle = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== module.title) {
      onUpdateTitle(trimmed)
    } else {
      setTitleValue(module.title) // reset if empty or unchanged
    }
    setEditingTitle(false)
  }

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return
    setAddingLesson(true)
    await onAddLesson(newLessonTitle.trim(), newLessonType)
    setNewLessonTitle('')
    setShowNewLesson(false)
    setAddingLesson(false)
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted border-b border-border">
        {/* Reorder */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-muted-foreground text-xs"
          >↑</button>
          <button
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="w-5 h-5 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-muted-foreground text-xs"
          >↓</button>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground text-sm">
          {expanded ? '▼' : '▶'}
        </button>

        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm font-medium focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 font-medium text-foreground text-sm cursor-pointer hover:text-primary"
            onClick={() => setEditingTitle(true)}
          >
            {module.title}
          </span>
        )}

        <span className="text-xs text-muted-foreground">{module.lessons.length} lessons</span>

        <button
          onClick={() => setShowNewLesson(true)}
          className="text-xs text-primary hover:underline"
        >
          + Lesson
        </button>

        <button
          onClick={() => { if (confirm('Delete this module and all its lessons?')) onDelete() }}
          className="text-xs text-red-400 hover:text-red-600"
        >
          Delete
        </button>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="divide-y divide-border">
          {module.lessons.length === 0 && !showNewLesson && (
            <div className="px-6 py-4 text-sm text-muted-foreground text-center">
              No lessons yet —{' '}
              <button onClick={() => setShowNewLesson(true)} className="text-primary hover:underline">
                add one
              </button>
            </div>
          )}

          {module.lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onDelete={() => { if (confirm('Delete this lesson?')) onDeleteLesson(lesson.id) }}
            />
          ))}

          {/* New lesson form */}
          {showNewLesson && (
            <div className="px-6 py-3 bg-primary/10 flex gap-2 items-center">
              <select
                value={newLessonType}
                onChange={(e) => setNewLessonType(e.target.value)}
                className="text-sm border border-border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="VIDEO">🎬 Video</option>
                <option value="TEXT">📝 Text</option>
                <option value="RESOURCE">📎 Resource</option>
              </select>
              <input
                autoFocus
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
                placeholder="Lesson title"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleAddLesson}
                disabled={addingLesson}
                className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {addingLesson ? '...' : 'Add'}
              </button>
              <button
                onClick={() => { setShowNewLesson(false); setNewLessonTitle('') }}
                className="text-muted-foreground hover:text-muted-foreground"
              >✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
