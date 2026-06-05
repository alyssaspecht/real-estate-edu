'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Lesson = {
  id: string
  title: string
  type: string
  position: number
  videoPlaybackId?: string | null
  contentBody?: string | null
  durationSeconds?: number | null
}

type Module = {
  id: string
  title: string
  position: number
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  slug: string
  modules: Module[]
}

type Props = {
  course: Course
  currentLesson: Lesson
  completedLessonIds: string[]
  userId: string
}

export function LessonPlayer({ course, currentLesson, completedLessonIds, userId }: Props) {
  const router = useRouter()
  const [completed, setCompleted] = useState(new Set(completedLessonIds))
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Flatten all lessons for next/prev navigation
  const allLessons = course.modules.flatMap(m => m.lessons)
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const markComplete = async () => {
    await fetch(`/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: currentLesson.id }),
    })
    setCompleted(prev => new Set([...prev, currentLesson.id]))

    // Auto-advance to next lesson
    if (nextLesson) {
      router.push(`/courses/${course.slug}/lessons/${nextLesson.id}`)
    }
  }

  const isCompleted = completed.has(currentLesson.id)

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-800 flex flex-col shrink-0 overflow-hidden">
          {/* Course title */}
          <div className="p-4 border-b border-gray-700">
            <Link href={`/courses/${course.slug}`} className="text-gray-400 text-xs hover:text-white">
              ← Back to course
            </Link>
            <h2 className="text-white font-semibold text-sm mt-2 line-clamp-2">{course.title}</h2>
            <p className="text-gray-400 text-xs mt-1">
              {completed.size} / {allLessons.length} lessons completed
            </p>
            {/* Progress bar */}
            <div className="mt-2 bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(completed.size / allLessons.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Curriculum */}
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((module) => (
              <div key={module.id}>
                <div className="px-4 py-2 bg-gray-750">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    {module.title}
                  </p>
                </div>
                {module.lessons.map((lesson) => {
                  const isCurrent = lesson.id === currentLesson.id
                  const isDone = completed.has(lesson.id)
                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.slug}/lessons/${lesson.id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xs shrink-0">
                        {isDone ? '✅' : lesson.type === 'VIDEO' ? '🎬' : lesson.type === 'TEXT' ? '📝' : '📎'}
                      </span>
                      <span className="line-clamp-2 flex-1">{lesson.title}</span>
                      {lesson.durationSeconds && (
                        <span className="text-xs opacity-60 shrink-0">
                          {Math.floor(lesson.durationSeconds / 60)}:{String(lesson.durationSeconds % 60).padStart(2, '0')}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {sidebarOpen ? '◀ Hide' : '▶ Show'} curriculum
          </button>
          <span className="text-white font-medium text-sm flex-1">{currentLesson.title}</span>
          <div className="flex items-center gap-3">
            {prevLesson && (
              <Link
                href={`/courses/${course.slug}/lessons/${prevLesson.id}`}
                className="text-gray-400 hover:text-white text-sm"
              >
                ← Prev
              </Link>
            )}
            {nextLesson && (
              <Link
                href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                className="text-gray-400 hover:text-white text-sm"
              >
                Next →
              </Link>
            )}
          </div>
        </div>

        {/* Lesson content */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson.type === 'VIDEO' && currentLesson.videoPlaybackId ? (
            <div className="bg-black">
              <mux-player
                stream-type="on-demand"
                playback-id={currentLesson.videoPlaybackId}
                style={{ width: '100%', aspectRatio: '16/9' }}
              />
            </div>
          ) : currentLesson.type === 'VIDEO' && !currentLesson.videoPlaybackId ? (
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              <p className="text-gray-400">No video uploaded for this lesson yet.</p>
            </div>
          ) : null}

          {/* Lesson info and complete button */}
          <div className="max-w-3xl mx-auto px-8 py-8">
            <h1 className="text-2xl font-bold text-white mb-4">{currentLesson.title}</h1>

            {currentLesson.type === 'TEXT' && currentLesson.contentBody && (
              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-gray-300 leading-relaxed">{currentLesson.contentBody}</p>
              </div>
            )}

            {/* Complete + navigate */}
            <div className="flex items-center gap-4 mt-8">
              {!isCompleted ? (
                <button
                  onClick={markComplete}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  {nextLesson ? 'Complete & Continue →' : 'Complete Course ✓'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-medium">✅ Completed</span>
                  {nextLesson && (
                    <Link
                      href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                      className="bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Next Lesson →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
