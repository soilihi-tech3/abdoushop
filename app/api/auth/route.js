// app/api/auth/route.js
import { prisma } from '../../../lib/db'
import { signToken, setSessionCookie, clearSessionCookie, getSession } from '../../../lib/auth'
import { apiRes, apiErr } from '../../../lib/utils'
import bcrypt from 'bcryptjs'

// POST /api/auth — login
export async function POST(req) {
  const { email, password } = await req.json()
  if (!email || !password) return apiErr('Email et mot de passe requis')

  const emp = await prisma.employee.findUnique({ where: { email } })
  if (!emp || !emp.active) return apiErr('Identifiants invalides', 401)

  const valid = await bcrypt.compare(password, emp.password)
  if (!valid) return apiErr('Identifiants invalides', 401)

  const token = await signToken({
    id: emp.id, email: emp.email,
    name: `${emp.first} ${emp.last}`,
    role: emp.role,
    initials: (emp.first[0] + emp.last[0]).toUpperCase()
  })

  const res = apiRes({ ok: true, user: { id: emp.id, name: `${emp.first} ${emp.last}`, email: emp.email, role: emp.role, initials: (emp.first[0] + emp.last[0]).toUpperCase() } })
  res.headers.set('Set-Cookie', `fartech_session=${token}; HttpOnly; Path=/; Max-Age=${60*60*24*7}; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`)
  return res
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = apiRes({ ok: true })
  res.headers.set('Set-Cookie', 'fartech_session=; HttpOnly; Path=/; Max-Age=0')
  return res
}

// GET /api/auth — get current session
export async function GET(req) {
  const token = req.cookies?.get?.('fartech_session')?.value || req.headers.get('cookie')?.match(/fartech_session=([^;]+)/)?.[1]
  if (!token) return apiErr('Non authentifié', 401)
  const { verifyToken } = await import('../../../lib/auth')
  const session = await verifyToken(token)
  if (!session) return apiErr('Session expirée', 401)
  return apiRes({ user: session })
}
