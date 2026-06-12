import { prisma } from '@/lib/prisma'

// ─── XP Values ────────────────────────────────────────────────────────
export const XP = {
  LESSON_COMPLETE:  10,
  COURSE_COMPLETE:  100,
  STREAK_3_DAY:     25,
  STREAK_7_DAY:     50,
  STREAK_30_DAY:    200,
  TEMPLATE_DOWNLOAD: 5,
} as const

// ─── Badge Definitions ─────────────────────────────────────────────────
export const BADGE_SLUGS = {
  FIRST_LESSON:   'first-lesson',
  FIRST_COURSE:   'first-course',
  THREE_COURSES:  'three-courses',
  STREAK_3:       'streak-3',
  STREAK_7:       'streak-7',
  STREAK_30:      'streak-30',
  XP_100:         'xp-100',
  XP_500:         'xp-500',
  XP_1000:        'xp-1000',
  FIRST_TEMPLATE: 'first-template',
} as const

// Seed badges into DB (idempotent — call once on startup or via API)
export async function seedBadges() {
  const badges = [
    { slug: BADGE_SLUGS.FIRST_LESSON,   name: 'First Step',      icon: '🎯', category: 'completion', description: 'Completed your very first lesson',         threshold: 1 },
    { slug: BADGE_SLUGS.FIRST_COURSE,   name: 'Graduate',        icon: '🎓', category: 'completion', description: 'Completed your first full course',          threshold: 1 },
    { slug: BADGE_SLUGS.THREE_COURSES,  name: 'Scholar',         icon: '📚', category: 'completion', description: 'Completed 3 courses',                       threshold: 3 },
    { slug: BADGE_SLUGS.STREAK_3,       name: 'On a Roll',       icon: '🔥', category: 'streak',     description: 'Maintained a 3-day learning streak',        threshold: 3 },
    { slug: BADGE_SLUGS.STREAK_7,       name: 'Week Warrior',    icon: '⚡', category: 'streak',     description: 'Maintained a 7-day learning streak',        threshold: 7 },
    { slug: BADGE_SLUGS.STREAK_30,      name: 'Unstoppable',     icon: '💎', category: 'streak',     description: 'Maintained a 30-day learning streak',       threshold: 30 },
    { slug: BADGE_SLUGS.XP_100,         name: 'Rising Star',     icon: '⭐', category: 'xp',         description: 'Earned 100 XP',                             threshold: 100 },
    { slug: BADGE_SLUGS.XP_500,         name: 'High Achiever',   icon: '🚀', category: 'xp',         description: 'Earned 500 XP',                             threshold: 500 },
    { slug: BADGE_SLUGS.XP_1000,        name: 'Legend',          icon: '🏆', category: 'xp',         description: 'Earned 1,000 XP',                           threshold: 1000 },
    { slug: BADGE_SLUGS.FIRST_TEMPLATE, name: 'Equipped',        icon: '🛠️', category: 'engagement', description: 'Downloaded your first template',            threshold: 1 },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where:  { slug: badge.slug },
      update: badge,
      create: badge,
    })
  }
}

// ─── Core Gamification Functions ───────────────────────────────────────

/** Award XP to a user and return their new total */
export async function awardXP(userId: string, amount: number): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { xp: { increment: amount } },
    select: { xp: true },
  })
  return user.xp
}

/** Update the user's streak. Returns { current, longest, bonusXP } */
export async function updateStreak(userId: string): Promise<{ current: number; longest: number; bonusXP: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const streak = await prisma.userStreak.findUnique({ where: { userId } })

  let current = 1
  let longest = 1
  let bonusXP = 0

  if (streak) {
    const last = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null
    if (last) {
      last.setHours(0, 0, 0, 0)
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Already recorded today — no change
        return { current: streak.current, longest: streak.longest, bonusXP: 0 }
      } else if (diffDays === 1) {
        // Consecutive day
        current = streak.current + 1
      } else {
        // Streak broken
        current = 1
      }
    }
    longest = Math.max(streak.longest, current)

    // Streak milestone bonuses
    if (current === 3  && streak.current < 3)  bonusXP = XP.STREAK_3_DAY
    if (current === 7  && streak.current < 7)  bonusXP = XP.STREAK_7_DAY
    if (current === 30 && streak.current < 30) bonusXP = XP.STREAK_30_DAY

    await prisma.userStreak.update({
      where: { userId },
      data:  { current, longest, lastActivityDate: today },
    })
  } else {
    await prisma.userStreak.create({
      data: { userId, current: 1, longest: 1, lastActivityDate: today },
    })
  }

  return { current, longest, bonusXP }
}

/** Check and award any newly-earned badges. Returns array of newly earned badge slugs. */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const [user, allBadges, existingBadges, completedCourses, downloadCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true, streak: true } }),
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    prisma.enrollment.count({ where: { userId, completedAt: { not: null } } }),
    prisma.templatePurchase.count({ where: { userId } }),
  ])

  if (!user) return []

  const earnedBadgeIds = new Set(existingBadges.map(b => b.badgeId))
  const newlyEarned: string[] = []

  // Completed lessons count
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completedAt: { not: null } },
  })

  const streakCurrent = user.streak?.current ?? 0

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue // already have it

    let earned = false

    switch (badge.slug) {
      case BADGE_SLUGS.FIRST_LESSON:   earned = completedLessons >= 1; break
      case BADGE_SLUGS.FIRST_COURSE:   earned = completedCourses >= 1; break
      case BADGE_SLUGS.THREE_COURSES:  earned = completedCourses >= 3; break
      case BADGE_SLUGS.STREAK_3:       earned = streakCurrent >= 3; break
      case BADGE_SLUGS.STREAK_7:       earned = streakCurrent >= 7; break
      case BADGE_SLUGS.STREAK_30:      earned = streakCurrent >= 30; break
      case BADGE_SLUGS.XP_100:         earned = user.xp >= 100; break
      case BADGE_SLUGS.XP_500:         earned = user.xp >= 500; break
      case BADGE_SLUGS.XP_1000:        earned = user.xp >= 1000; break
      case BADGE_SLUGS.FIRST_TEMPLATE: earned = downloadCount >= 1; break
    }

    if (earned) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } })
      newlyEarned.push(badge.slug)
    }
  }

  return newlyEarned
}

/** Full gamification event after a lesson is completed */
export async function onLessonComplete(userId: string): Promise<{
  xpEarned: number
  newTotal: number
  newBadges: string[]
  streak: { current: number; longest: number }
}> {
  // Award lesson XP
  let newTotal = await awardXP(userId, XP.LESSON_COMPLETE)
  let xpEarned = XP.LESSON_COMPLETE

  // Update streak + collect bonus XP
  const { current, longest, bonusXP } = await updateStreak(userId)
  if (bonusXP > 0) {
    newTotal = await awardXP(userId, bonusXP)
    xpEarned += bonusXP
  }

  // Check for new badges
  const newBadges = await checkAndAwardBadges(userId)

  return { xpEarned, newTotal, newBadges, streak: { current, longest } }
}

/** Full gamification event after a course is completed */
export async function onCourseComplete(userId: string): Promise<{
  xpEarned: number
  newTotal: number
  newBadges: string[]
}> {
  const newTotal = await awardXP(userId, XP.COURSE_COMPLETE)
  const newBadges = await checkAndAwardBadges(userId)
  return { xpEarned: XP.COURSE_COMPLETE, newTotal, newBadges }
}

/** XP event for downloading a template */
export async function onTemplateDownload(userId: string): Promise<void> {
  await awardXP(userId, XP.TEMPLATE_DOWNLOAD)
  await checkAndAwardBadges(userId)
}
