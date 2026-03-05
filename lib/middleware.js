// lib/middleware.js — helper to protect API routes
import { verifyToken } from './auth'

export async function requireAuth(req) {
  const token = req.cookies?.get?.('fartech_session')?.value
    || req.headers.get('cookie')?.match(/fartech_session=([^;]+)/)?.[1]
  if (!token) return null
  return verifyToken(token)
}

export async function requireAdmin(req) {
  const session = await requireAuth(req)
  if (!session || session.role !== 'admin') return null
  return session
}
