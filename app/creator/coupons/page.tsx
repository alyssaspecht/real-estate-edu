'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Coupon = {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  courseId: string | null
  course: { title: string } | null
  expiresAt: string | null
  active: boolean
  usedCount: number
  createdAt: string
}

type Course = {
  id: string
  title: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: '',
    courseId: '',
    expiresAt: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCoupons()
    fetchCourses()
  }, [])

  async function fetchCoupons() {
    const res = await fetch('/api/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }

  async function fetchCourses() {
    const res = await fetch('/api/creator/courses')
    if (res.ok) setCourses(await res.json())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreating(true)

    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        courseId: form.courseId || null,
        expiresAt: form.expiresAt || null,
      }),
    })

    setCreating(false)
    if (res.ok) {
      setSuccess('Coupon created!')
      setForm({ code: '', discountType: 'PERCENT', discountValue: '', courseId: '', expiresAt: '' })
      fetchCoupons()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create coupon')
    }
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    })
    if (res.ok) fetchCoupons()
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Delete this coupon?')) return
    const res = await fetch('/api/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) fetchCoupons()
  }

  function formatDiscount(c: Coupon) {
    return c.discountType === 'PERCENT'
      ? `${c.discountValue}% off`
      : `$${(c.discountValue / 100).toFixed(2)} off`
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/creator" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">← Creator Dashboard</Link>
            <h1 className="text-3xl font-bold text-foreground">Coupon Codes</h1>
            <p className="text-muted-foreground mt-1">Create discount codes for your courses</p>
          </div>
        </div>

        {/* Create form */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Create New Coupon</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'PERCENT' | 'FIXED' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {form.discountType === 'PERCENT' ? 'Discount %' : 'Discount Amount ($)'}
              </label>
              <input
                type="number"
                min={1}
                max={form.discountType === 'PERCENT' ? 100 : undefined}
                step={form.discountType === 'FIXED' ? '0.01' : '1'}
                placeholder={form.discountType === 'PERCENT' ? '20' : '10.00'}
                value={form.discountValue}
                onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Apply To</label>
              <select
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All my courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Expiration Date (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating…' : 'Create Coupon'}
              </button>
            </div>

            {error && <p className="col-span-2 text-red-600 text-sm">{error}</p>}
            {success && <p className="col-span-2 text-green-600 text-sm">{success}</p>}
          </form>
        </div>

        {/* Coupon list */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Your Coupons</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No coupons yet. Create one above.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-gray-50 border-b border-border">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Applies To</th>
                  <th className="px-6 py-3">Expires</th>
                  <th className="px-6 py-3">Uses</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-foreground text-sm">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{formatDiscount(coupon)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[160px] truncate">
                      {coupon.course ? coupon.course.title : 'All courses'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{coupon.usedCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          coupon.active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {coupon.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
