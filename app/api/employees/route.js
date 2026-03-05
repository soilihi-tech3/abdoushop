import { prisma } from '../../../lib/db'
import { requireAdmin } from '../../../lib/middleware'
import { apiRes, apiErr } from '../../../lib/utils'
import bcrypt from 'bcryptjs'

export async function GET(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  const emps = await prisma.employee.findMany({
    select: { id: true, first: true, last: true, email: true, role: true, active: true, photo: true, createdAt: true },
    orderBy: { first: 'asc' }
  })
  return apiRes(emps.map(e => ({ ...e, name: e.first+' '+e.last })))
}

export async function POST(req) {
  const session = await requireAdmin(req)
  if (!session) return apiErr('Accès refusé', 403)
  let { name, first, last, email, password, role = 'employee', active = true, photo } = await req.json()
  // Support single 'name' field
  if (name && !first) { const parts = name.trim().split(' '); first = parts[0]; last = parts.slice(1).join(' ')||parts[0] }
  if (!first || !email || !password) return apiErr('Champs obligatoires manquants')
  const existing = await prisma.employee.findUnique({ where: { email } })
  if (existing) return apiErr('Email déjà utilisé')
  const hash = await bcrypt.hash(password, 10)
  const emp = await prisma.employee.create({
    data: { first, last: last||'', email, password: hash, role, active, photo },
    select: { id: true, first: true, last: true, email: true, role: true, active: true }
  })
  return apiRes({ ...emp, name: emp.first+' '+emp.last }, 201)
}
