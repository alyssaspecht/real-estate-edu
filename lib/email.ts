import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Sender address — update to your verified Resend domain when ready
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type EnrollmentEmailArgs = {
  learnerEmail: string
  learnerName: string | null
  creatorEmail: string
  creatorName: string | null
  courseTitle: string
  courseSlug: string
  firstLessonId: string | null
}

export async function sendEnrollmentEmails(args: EnrollmentEmailArgs) {
  const { learnerEmail, learnerName, creatorEmail, creatorName, courseTitle, courseSlug, firstLessonId } = args

  const startUrl = firstLessonId
    ? `${SITE_URL}/courses/${courseSlug}/lessons/${firstLessonId}`
    : `${SITE_URL}/courses/${courseSlug}`

  const learnerHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">You're enrolled! 🎉</h1>
      <p style="color: #555; margin-bottom: 24px;">
        Hi ${learnerName ?? 'there'}, you now have access to:
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="font-size: 18px; font-weight: 600; margin: 0;">${courseTitle}</p>
      </div>
      <a href="${startUrl}" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Start Learning →
      </a>
      <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
        You can access your course anytime at <a href="${SITE_URL}/dashboard" style="color: #6b7280;">${SITE_URL}/dashboard</a>
      </p>
    </div>
  `

  const creatorHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">New student enrolled 🎓</h1>
      <p style="color: #555; margin-bottom: 24px;">
        Hi ${creatorName ?? 'there'}, someone just joined your course:
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 8px;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">${courseTitle}</p>
        <p style="color: #6b7280; margin: 0;">Student: <strong style="color: #111;">${learnerName ?? learnerEmail}</strong></p>
      </div>
      <a href="${SITE_URL}/creator/courses" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 20px;">
        View your dashboard →
      </a>
    </div>
  `

  // Fire both emails in parallel, swallow errors so enrollment never fails
  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: learnerEmail,
      subject: `You're enrolled in "${courseTitle}"`,
      html: learnerHtml,
    }),
    resend.emails.send({
      from: FROM,
      to: creatorEmail,
      subject: `New student enrolled in "${courseTitle}"`,
      html: creatorHtml,
    }),
  ])
}
