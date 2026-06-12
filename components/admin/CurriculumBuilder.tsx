'use client'

import { useState } from 'react'
import { ModuleItem } from './ModuleItem'

type Resource = { id: string; name: string; fileUrl: string; type: string }

type Lesson = {
  id: string
  title: string
  type: string
  position: number
  isFreePreview?: boolean
  videoPlaybackId?: string | null
  resources?: Resource[]
}

type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

type Course = {
  id: string
  modules: Module[]
}

export function CurriculumBuilder({ course }: { course: Course }) {
  const [modules, setModules] = useState<Module[]>(course.modules)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const [showNewModule, setShowNewModule] = useState(false)

  const addModule = async () => {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)

    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id, title: newModuleTitle }),
    })

    const data = await res.json()
    if (res.ok) {
      setModules(prev => [...prev, data.module])
      setNewModuleTitle('')
      setShowNewModule(false)
    }
    setAddingModule(false)
  }

  const deleteModule = async (moduleId: string) => {
    const res = await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' })
    if (res.ok) setModules(prev => prev.filter(m => m.id !== moduleId))
  }

  const updateModuleTitle = async (moduleId: string, title: string) => {
    await fetch(`/api/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, title } : m))
  }

  const addLesson = async (moduleId: string, title: string, type: string) => {
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, title, type }),
    })
    const data = await res.json()
    if (res.ok) {
      setModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, data.lesson] } : m
      ))
    }
  }

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
    if (res.ok) {
      setModules(prev => prev.map(m =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
          : m
      ))
    }
  }

  const moveModule = async (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newModules.length) return

    ;[newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]]

    setModules(newModules)

    // Update positions in DB
    await Promise.all(newModules.map((m, i) =>
      fetch(`/api/modules/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: i + 1 }),
      })
    ))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Curriculum <span className="text-muted-foreground font-normal text-sm">({modules.length} modules)</span>
        </h2>
        <button
          onClick={() => setShowNewModule(true)}
          className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Module
        </button>
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {modules.length === 0 && !showNewModule && (
          <div className="bg-card rounded-2xl border-2 border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground mb-3">No modules yet</p>
            <button
              onClick={() => setShowNewModule(true)}
              className="text-sm text-primary font-medium hover:underline"
            >
              Add your first module
            </button>
          </div>
        )}

        {modules.map((module, index) => (
          <ModuleItem
            key={module.id}
            module={module}
            index={index}
            total={modules.length}
            onDelete={() => deleteModule(module.id)}
            onUpdateTitle={(title) => updateModuleTitle(module.id, title)}
            onAddLesson={(title, type) => addLesson(module.id, title, type)}
            onDeleteLesson={(lessonId) => deleteLesson(module.id, lessonId)}
            onMove={(dir) => moveModule(index, dir)}
          />
        ))}

        {/* New module input */}
        {showNewModule && (
          <div className="bg-card rounded-2xl border border-blue-200 p-4 flex gap-2">
            <input
              type="text"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addModule()}
              autoFocus
              placeholder="Module title (e.g. Introduction)"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addModule}
              disabled={addingModule}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {addingModule ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowNewModule(false); setNewModuleTitle('') }}
              className="text-muted-foreground hover:text-muted-foreground px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
