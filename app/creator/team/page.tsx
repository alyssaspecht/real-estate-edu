import { getCurrentUser } from '@/lib/auth/getUser'
import { prisma } from '@/lib/prisma'
import { TeamRoster } from '@/components/creator/TeamRoster'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const [memberships, courses] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { teamLeadId: user.id },
      include: {
        member: {
          include: {
            assignmentsToMe: {
              include: {
                course: {
                  include: {
                    modules: { include: { lessons: { select: { id: true } } } },
                  },
                },
              },
            },
            lessonProgress: {
              where: { completedAt: { not: null } },
              select: { lessonId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.findMany({
      where: { creatorId: user.id, status: 'PUBLISHED' },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  const members = memberships.map((m) => {
    const completedLessonIds = new Set(m.member.lessonProgress.map((p) => p.lessonId))
    const assignments = m.member.assignmentsToMe.map((a) => {
      const allLessonIds = a.course.modules.flatMap((mod) => mod.lessons.map((l) => l.id))
      const total = allLessonIds.length
      const completed = allLessonIds.filter((id) => completedLessonIds.has(id)).length
      return {
        courseId: a.courseId,
        courseTitle: a.course.title,
        total,
        completed,
      }
    })
    return {
      id: m.member.id,
      name: m.member.name,
      email: m.member.email,
      assignments,
    }
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">
            Add team members and assign them courses to complete. Track progress here.
          </p>
        </div>
        <TeamRoster initialMembers={members} courses={courses} />
      </div>
    </div>
  )
}
