import { prisma } from '@/lib/prisma'

/**
 * Fire notifications when a reply is posted to a discussion.
 * Notifies:
 *  - The thread author (if they didn't post the reply themselves)
 *  - Anyone else who has previously replied in the thread (participants)
 *    — deduped, excluding the new replier
 */
export async function notifyDiscussionReply({
  discussionId,
  replierId,
  replierName,
  courseSlug,
  courseTitle,
}: {
  discussionId: string
  replierId: string
  replierName: string | null
  courseSlug: string
  courseTitle: string
}) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      replies: { select: { authorId: true } },
    },
  })
  if (!discussion) return

  // Build unique set of people to notify (thread author + past repliers), minus the new replier
  const toNotify = new Set<string>()
  toNotify.add(discussion.authorId)
  for (const r of discussion.replies) toNotify.add(r.authorId)
  toNotify.delete(replierId) // don't notify yourself

  if (toNotify.size === 0) return

  const poster = replierName ?? 'Someone'
  const linkUrl = `/courses/${courseSlug}#discussion-${discussionId}`

  await prisma.notification.createMany({
    data: Array.from(toNotify).map(userId => ({
      userId,
      type: 'discussion_reply',
      title: `New reply in "${discussion.title}"`,
      body: `${poster} replied in ${courseTitle}`,
      linkUrl,
    })),
    skipDuplicates: true,
  })
}
