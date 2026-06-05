import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    { name: 'Lead Generation', slug: 'lead-generation' },
    { name: 'Listing Strategies', slug: 'listing-strategies' },
    { name: 'Buyer Representation', slug: 'buyer-representation' },
    { name: 'Marketing & Branding', slug: 'marketing-branding' },
    { name: 'Negotiation', slug: 'negotiation' },
    { name: 'Technology & Tools', slug: 'technology-tools' },
    { name: 'Business Development', slug: 'business-development' },
    { name: 'Mindset & Productivity', slug: 'mindset-productivity' },
    { name: 'Real Estate Law', slug: 'real-estate-law' },
    { name: 'Investment Properties', slug: 'investment-properties' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
