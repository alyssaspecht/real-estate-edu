import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/getUser'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TemplateForm } from '@/components/templates/TemplateForm'

export const dynamic = 'force-dynamic'

export default async function NewTemplatePage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'CREATOR' && user.role !== 'ADMIN')) redirect('/dashboard')

  const categories = await prisma.templateCategory.findMany({ orderBy: { position: 'asc' } })

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/creator/templates" className="text-sm text-muted-foreground hover:text-foreground mb-6 block">
          ← My Templates
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-8">New Template</h1>
        <TemplateForm
          categories={categories}
          isAdmin={user.role === 'ADMIN'}
        />
      </div>
    </div>
  )
}
