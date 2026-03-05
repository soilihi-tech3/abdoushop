import { prisma } from '../../../lib/db'
import { requireAuth, requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'

export async function GET(req) {
  const session = await requireAuth(req)
  if (!session) return apiErr('Non authentifié', 401)
  const rows = await prisma.setting.findMany()
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return apiRes(settings)
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const data = await req.json()
  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  )
  return apiRes({ ok: true })
}
