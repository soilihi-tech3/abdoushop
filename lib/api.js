// Centralized API client — toutes les fonctions fetch

const req = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}

// ── AUTH ──
export const login = (email, password) => req('/api/auth', { method: 'POST', body: { email, password } })
export const logout = () => req('/api/auth', { method: 'DELETE' })
export const getMe = () => req('/api/auth')

// ── PRODUCTS ──
export const getProducts = () => req('/api/products')
export const createProduct = (data) => req('/api/products', { method: 'POST', body: data })
export const updateProduct = (id, data) => req(`/api/products/${id}`, { method: 'PUT', body: data })
export const deleteProduct = (id) => req(`/api/products/${id}`, { method: 'DELETE' })

// ── CATEGORIES ──
export const getCategories = () => req('/api/categories')
export const createCategory = (data) => req('/api/categories', { method: 'POST', body: data })
export const updateCategory = (id, data) => req(`/api/categories/${id}`, { method: 'PUT', body: data })
export const deleteCategory = (id) => req(`/api/categories/${id}`, { method: 'DELETE' })

// ── BRANDS ──
export const getBrands = () => req('/api/brands')
export const createBrand = (data) => req('/api/brands', { method: 'POST', body: data })
export const updateBrand = (id, data) => req(`/api/brands/${id}`, { method: 'PUT', body: data })
export const deleteBrand = (id) => req(`/api/brands/${id}`, { method: 'DELETE' })

// ── SUPPLIERS ──
export const getSuppliers = () => req('/api/suppliers')
export const createSupplier = (data) => req('/api/suppliers', { method: 'POST', body: data })
export const updateSupplier = (id, data) => req(`/api/suppliers/${id}`, { method: 'PUT', body: data })
export const deleteSupplier = (id) => req(`/api/suppliers/${id}`, { method: 'DELETE' })

// ── EMPLOYEES ──
export const getEmployees = () => req('/api/employees')
export const createEmployee = (data) => req('/api/employees', { method: 'POST', body: data })
export const updateEmployee = (id, data) => req(`/api/employees/${id}`, { method: 'PUT', body: data })
export const deleteEmployee = (id) => req(`/api/employees/${id}`, { method: 'DELETE' })

// ── TRANSACTIONS ──
export const getTransactions = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/api/transactions${qs ? '?' + qs : ''}`)
}
export const createTransaction = (data) => req('/api/transactions', { method: 'POST', body: data })

// ── PURCHASES ──
export const getPurchases = () => req('/api/purchases')
export const createPurchase = (data) => req('/api/purchases', { method: 'POST', body: data })
export const deletePurchase = (id) => req(`/api/purchases/${id}`, { method: 'DELETE' })

// ── SAVINGS ──
export const getSavings = () => req('/api/savings')
export const createSaving = (data) => req('/api/savings', { method: 'POST', body: data })
export const updateSaving = (id, data) => req(`/api/savings/${id}`, { method: 'PUT', body: data })
export const deleteSaving = (id) => req(`/api/savings/${id}`, { method: 'DELETE' })

// ── DASHBOARD ──
export const getDashboard = () => req('/api/dashboard')

// ── SETTINGS ──
export const getSettings = () => req('/api/settings')
export const saveSettings = (data) => req('/api/settings', { method: 'POST', body: data })
