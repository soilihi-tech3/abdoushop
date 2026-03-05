import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const savings = await prisma.saving.findMany({ orderBy: { date: 'desc' } })
  return apiRes(savings)
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { amount, date, note } = await req.json()
  if (!amount || !date) return apiErr('Montant et date requis')
  const saving = await prisma.saving.create({
    data: { amount: +amount, date: new Date(date), note }
  })
  return apiRes(saving, 201)
}
