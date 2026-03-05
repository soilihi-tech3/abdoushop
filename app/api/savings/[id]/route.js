import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'

export async function PUT(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const { amount, date, note } = await req.json()
  const saving = await prisma.saving.update({
    where: { id: +params.id },
    data: { amount: +amount, date: new Date(date), note }
  })
  return apiRes(saving)
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.saving.delete({ where: { id: +params.id } })
  return apiRes({ ok: true })
}
