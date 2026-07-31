import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const EMPTY_FORM = { title: '', description: '', category: '', department: '', event_date: '', visibility: 'public' }

const STATUS_STYLES = {
  draft: 'bg-slate-200 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-amber-100 text-amber-800',
}

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { fields: ['title', 'department'] })
}

export default function AdminGalleries({ basePath = '/admin/galleries' }) {
  const [galleries, setGalleries] = useState([])
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('-date')

  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  const [uploadGalleryId, setUploadGalleryId] = useState(null)
  const [uploadType, setUploadType] = useState('photo')
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploadVideoUrl, setUploadVideoUrl] = useState('')
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter) params.set('category', categoryFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (sort) params.set('sort', sort)
    api.get(`/galleries/?${params.toString()}`)
      .then((res) => setGalleries(res.data || []))
      .catch((err) => setError(readableError(err, 'Unable to load galleries.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, categoryFilter, statusFilter, sort])
  useEffect(() => {
    api.get('/ministries/').then((res) => setDepartments(res.data || [])).catch(() => {})
    api.get('/gallery-categories/?active_only=true').then((res) => {
      setCategories(res.data || [])
      if (res.data?.length) setForm((f) => ({ ...f, category: f.category || String(res.data[0].id) }))
    })
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setCreating(true)
    try {
      const payload = { ...form, category: Number(form.category), department: form.department || null, event_date: form.event_date || null }
      await api.post('/galleries/', payload)
      setForm((f) => ({ ...EMPTY_FORM, category: f.category }))
      setNotice('Gallery created as a draft — publish it when ready.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to create gallery.'))
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (g) => {
    setError('')
    try {
      await api.post(`/galleries/${g.id}/publish/`, { action: g.status === 'published' ? 'unpublish' : 'publish' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update publish status.'))
    }
  }

  const toggleArchive = async (g) => {
    setError('')
    try {
      await api.post(`/galleries/${g.id}/archive/`, { action: g.status === 'archived' ? 'restore' : 'archive' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update gallery status.'))
    }
  }

  const toggleFeatured = async (g) => {
    setError('')
    try {
      await api.post(`/galleries/${g.id}/feature/`, { featured: !g.is_featured })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update featured gallery.'))
    }
  }

  const duplicateGallery = async (id) => {
    setError('')
    setNotice('')
    try {
      await api.post(`/galleries/${id}/duplicate/`)
      setNotice('Gallery duplicated as a new draft (metadata only — photos/videos are not copied).')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to duplicate gallery.'))
    }
  }

  const toggleUploadPanel = (id) => {
    setUploadGalleryId(uploadGalleryId === id ? null : id)
    setUploadFiles([])
    setUploadVideoUrl('')
    setUploadCaption('')
    setError('')
  }

  const submitUpload = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setUploading(true)
    try {
      if (uploadType === 'photo') {
        if (!uploadFiles.length) throw new Error('Choose at least one image file first.')
        setUploadProgress({ done: 0, total: uploadFiles.length })
        let failures = 0
        for (let i = 0; i < uploadFiles.length; i++) {
          const fd = new FormData()
          fd.append('item_type', 'photo')
          fd.append('image', uploadFiles[i])
          if (uploadFiles.length === 1 && uploadCaption) fd.append('caption', uploadCaption)
          try {
            await api.post(`/galleries/${uploadGalleryId}/items/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          } catch {
            failures += 1
          }
          setUploadProgress({ done: i + 1, total: uploadFiles.length })
        }
        setNotice(failures ? `Uploaded ${uploadFiles.length - failures} of ${uploadFiles.length} (${failures} failed).` : `Uploaded ${uploadFiles.length} photo${uploadFiles.length === 1 ? '' : 's'}.`)
      } else {
        if (!uploadVideoUrl) throw new Error('Enter a video URL first.')
        await api.post(`/galleries/${uploadGalleryId}/items/`, { item_type: 'video', video_url: uploadVideoUrl, caption: uploadCaption })
        setNotice('Video added.')
      }
      setUploadGalleryId(null)
      setUploadFiles([])
      setUploadVideoUrl('')
      setUploadCaption('')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to upload.'))
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const removeGallery = async (id) => {
    if (!confirm('Move this gallery to the recycle bin? You can restore it later, or delete it permanently from there.')) return
    setError('')
    try {
      await api.delete(`/galleries/${id}/`)
      setNotice('Gallery moved to the recycle bin.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to delete gallery.'))
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Galleries</h1>
          <p className="text-slate-600 mt-2">
            Unlimited photo/video galleries for Sunday services, events, conferences, crusades, and every
            department. Draft until you publish; feature one on the homepage.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={basePath.replace(/\/galleries$/, '/gallery-categories')} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Categories</Link>
          <Link to={`${basePath}/recycle-bin`} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold">Recycle Bin</Link>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800">{notice}</div>}

      <form onSubmit={handleCreate} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Create Gallery</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label>
            <span className="text-slate-700 text-sm">Title</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Youth Camp 2026" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Category</span>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Department (optional)</span>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">— None —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.ministry_name}</option>)}
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Event Date (optional)</span>
            <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label>
            <span className="text-slate-700 text-sm">Visibility</span>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="public">Public</option>
              <option value="members">Members Only</option>
              <option value="admins">Administrators Only</option>
            </select>
          </label>
          <label>
            <span className="text-slate-700 text-sm">Description (optional)</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        </div>
        <button disabled={creating} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {creating ? 'Creating…' : 'Create Gallery'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm border flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search galleries…" className="rounded-xl border border-slate-300 px-3 py-2 text-sm flex-1 min-w-[180px]" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="-date">Newest First</option>
          <option value="date">Oldest First</option>
          <option value="title">Title A–Z</option>
          <option value="-title">Title Z–A</option>
          <option value="-photos">Most Photos</option>
        </select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : galleries.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 p-10 text-center">
            {search || categoryFilter || statusFilter ? (
              <p className="text-slate-500 text-sm">No galleries match this search/filter.</p>
            ) : (
              <>
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-slate-700 font-semibold">No galleries yet</p>
                <p className="text-slate-500 text-sm mt-1">Use the "Create Gallery" form above to add your first one — once it's created, an "Upload Photos/Videos" button appears on its card right here.</p>
              </>
            )}
          </div>
        ) : (
          galleries.map((g) => (
            <div key={g.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{g.title}</h3>
                    {g.is_featured && <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">★ Featured</span>}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[g.status] || 'bg-slate-100 text-slate-800'}`}>{g.status}</span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    {g.category_name} · {g.department_name || 'No department'} · {g.item_count} photo/video{g.item_count === 1 ? '' : 's'} · {g.album_count} album{g.album_count === 1 ? '' : 's'} · {g.visibility}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => toggleUploadPanel(g.id)} className="rounded-full bg-slate-900 text-white px-4 py-1.5 text-sm font-semibold">
                    {uploadGalleryId === g.id ? 'Cancel Upload' : 'Upload Photos/Videos'}
                  </button>
                  <Link to={`${basePath}/${g.id}`} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Manage</Link>
                  <button onClick={() => togglePublish(g)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">
                    {g.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => toggleFeatured(g)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">
                    {g.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => toggleArchive(g)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">
                    {g.status === 'archived' ? 'Restore' : 'Archive'}
                  </button>
                  <button onClick={() => duplicateGallery(g.id)} className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold">Duplicate</button>
                  <button onClick={() => removeGallery(g.id)} className="rounded-full bg-red-500/15 text-red-700 px-4 py-1.5 text-sm font-semibold hover:bg-red-500/25">Delete</button>
                </div>
              </div>

              {uploadGalleryId === g.id && (
                <form onSubmit={submitUpload} className="mt-5 pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold w-fit">
                    <button type="button" onClick={() => setUploadType('photo')} className={`px-4 py-2 rounded-lg transition ${uploadType === 'photo' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Photos</button>
                    <button type="button" onClick={() => setUploadType('video')} className={`px-4 py-2 rounded-lg transition ${uploadType === 'video' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Video Link</button>
                  </div>

                  {uploadType === 'photo' ? (
                    <label className="block">
                      <span className="text-slate-700 text-sm">Image files — select multiple to bulk upload</span>
                      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
                      {uploadFiles.length > 1 && <p className="text-xs text-slate-500 mt-1">{uploadFiles.length} files selected.</p>}
                    </label>
                  ) : (
                    <label className="block">
                      <span className="text-slate-700 text-sm">Video URL (YouTube, Vimeo, Facebook, etc.)</span>
                      <input type="url" value={uploadVideoUrl} onChange={(e) => setUploadVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
                    </label>
                  )}
                  {(uploadType === 'video' || uploadFiles.length <= 1) && (
                    <label className="block">
                      <span className="text-slate-700 text-sm">Caption (optional)</span>
                      <input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
                    </label>
                  )}
                  <button disabled={uploading} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
                    {uploadProgress ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…` : uploading ? 'Uploading…' : uploadType === 'photo' ? `Upload ${uploadFiles.length > 1 ? `${uploadFiles.length} Photos` : 'Photo'}` : 'Add Video'}
                  </button>
                  <p className="text-xs text-slate-500">Need albums, tags, or a custom video thumbnail? Use "Manage" instead.</p>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
