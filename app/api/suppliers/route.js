import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
  return apiRes(suppliers)
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { name, phone, email, address } = await req.json()
  if (!name) return apiErr('Nom requis')
  const supplier = await prisma.supplier.create({ data: { name, phone, email, address } })
  return apiRes(supplier, 201)
}
