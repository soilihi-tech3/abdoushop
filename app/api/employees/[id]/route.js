import { prisma } from '../../../../lib/db'
import { requireAdmin } from '../../../../lib/middleware'
import { apiRes, apiErr } from '../../../../lib/utils'
import bcrypt from 'bcryptjs'

export async function PUT(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const id = +params.id
  let { name, first, last, email, password, role, active } = await req.json()
  if (name && !first) { const parts = name.trim().split(' '); first = parts[0]; last = parts.slice(1).join(' ')||parts[0] }
  const data = {}
  if (first) data.first = first
  if (last !== undefined) data.last = last
  if (email) data.email = email
  if (password) data.password = await bcrypt.hash(password, 10)
  if (role) data.role = role
  if (active !== undefined) data.active = active
  const emp = await prisma.employee.update({ where: { id }, data, select: { id: true, first: true, last: true, email: true, role: true, active: true } })
  return apiRes({ ...emp, name: emp.first+' '+emp.last })
}

export async function DELETE(req, { params }) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  await prisma.employee.delete({ where: { id: +params.id } })
  return apiRes({ deleted: true })
}
