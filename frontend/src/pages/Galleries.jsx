import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Galleries() {
  const [galleries, setGalleries] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('category', categoryFilter)
    api.get(`/galleries/?${params.toString()}`)
      .then((res) => { setGalleries(res.data || []); setError('') })
      .catch(() => setError('Unable to load galleries. Please try again later.'))
      .finally(() => setLoading(false))
  }, [search, categoryFilter])

  useEffect(() => {
    api.get('/gallery-categories/?active_only=true').then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen pb-10">
      <section className="bg-gradient-hero text-white px-4 py-12 md:py-16">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🖼️ Gallery</h1>
          <p className="text-lg text-primary-100">Photos and videos from worship, events, conferences, and life together as a church family.</p>
        </div>
      </section>

      <div className="container px-4 py-12">
        <div className="flex flex-wrap gap-3 mb-8">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search galleries…"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-danger-50 border-l-4 border-danger-500 p-6 text-danger-800">
            <p className="font-semibold">⚠️ Unable to Load</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading galleries...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-gray-700 font-semibold text-lg">No galleries yet</p>
            <p className="text-gray-600 mt-2">Check back soon for photos and videos</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((g) => (
              <Link key={g.id} to={`/galleries/${g.id}`} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition bg-white">
                <div className="relative h-44 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 flex items-center justify-center overflow-hidden">
                  {g.cover_image ? (
                    <img src={g.cover_image} alt={g.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <span className="text-5xl opacity-80">🖼️</span>
                  )}
                  <span className="absolute top-3 left-3 text-xs font-semibold uppercase tracking-wide text-white/90 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    {g.category_name}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-primary-800 group-hover:text-primary-600 transition">{g.title}</h3>
                  {g.department_name && <p className="text-sm text-gray-500 mt-1">{g.department_name}</p>}
                  <p className="text-sm text-gray-600 mt-2">{g.item_count} item{g.item_count === 1 ? '' : 's'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
