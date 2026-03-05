import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fartech-secret-key-change-in-prod')
const COOKIE = 'fartech_session'

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(token) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE)
}
