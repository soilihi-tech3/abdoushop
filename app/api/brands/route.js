import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } })
  return apiRes(brands)
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { name, desc } = await req.json()
  if (!name) return apiErr('Nom requis')
  const brand = await prisma.brand.create({ data: { name, desc } })
  return apiRes(brand, 201)
}
