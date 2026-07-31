import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { extractErrorMessage } from '../utils/errors'

const STATUS_STYLES = {
  draft: 'bg-slate-200 text-slate-700',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-amber-100 text-amber-800',
}

function readableError(err, fallback) {
  return extractErrorMessage(err, fallback, { fields: ['image', 'video_url', 'title', 'name'] })
}

function ItemCard({ item, onRemove, onReplace, replacing, onEditTags }) {
  const fileInputRef = useRef(null)
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      {item.item_type === 'photo' ? (
        <img src={item.image} alt={item.caption || 'Gallery item'} className="w-full aspect-square object-cover" />
      ) : (
        <a href={item.video_url} target="_blank" rel="noreferrer" className="relative flex items-center justify-center w-full aspect-square bg-slate-900 text-white text-4xl overflow-hidden">
          {item.thumbnail && <img src={item.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
          <span className="relative">▶</span>
        </a>
      )}
      <div className="p-3 space-y-2">
        {item.title && <p className="text-sm font-semibold text-slate-800 truncate" title={item.title}>{item.title}</p>}
        {item.caption && <p className="text-xs text-slate-600 truncate" title={item.caption}>{item.caption}</p>}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{t}</span>)}
          </div>
        )}
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status] || 'bg-slate-100'}`}>{item.status}</span>
        <div className="flex gap-2">
          {item.item_type === 'photo' && (
            <>
              <a href={item.image} download className="flex-1 text-center rounded-full border border-slate-300 px-2 py-1.5 text-xs font-semibold hover:bg-slate-50">Download</a>
              <button
                type="button"
                disabled={replacing}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-full border border-slate-300 px-2 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                {replacing ? 'Replacing…' : 'Replace'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onReplace(item.id, f)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </div>
        <button onClick={() => onEditTags(item)} className="w-full rounded-full border border-slate-300 px-2 py-1.5 text-xs font-semibold hover:bg-slate-50">Edit Title/Tags</button>
        <button onClick={() => onRemove(item.id)} className="w-full rounded-full bg-red-500/15 text-red-700 px-2 py-1.5 text-xs font-semibold hover:bg-red-500/25">Remove</button>
      </div>
    </div>
  )
}

export default function AdminGalleryDetail({ basePath = '/admin/galleries' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [gallery, setGallery] = useState(null)
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [itemType, setItemType] = useState('photo')
  const [files, setFiles] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [videoThumb, setVideoThumb] = useState(null)
  const [caption, setCaption] = useState('')
  const [targetAlbum, setTargetAlbum] = useState('')
  const [adding, setAdding] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const [newAlbumName, setNewAlbumName] = useState('')
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [expandedAlbum, setExpandedAlbum] = useState(null)

  const [replacingId, setReplacingId] = useState(null)
  const [tagEditItem, setTagEditItem] = useState(null)
  const [tagEditForm, setTagEditForm] = useState({ title: '', tags: '' })

  const load = () => {
    api.get(`/galleries/${id}/`)
      .then((res) => setGallery(res.data))
      .catch((err) => setError(readableError(err, 'Unable to load this gallery.')))
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    api.get('/ministries/').then((res) => setDepartments(res.data || [])).catch(() => {})
    api.get('/gallery-categories/?active_only=true').then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  const startEdit = () => {
    setEditForm({
      title: gallery.title,
      description: gallery.description || '',
      category: gallery.category,
      department: gallery.department || '',
      event_name: gallery.event_name || '',
      event_theme: gallery.event_theme || '',
      event_location: gallery.event_location || '',
      event_date: gallery.event_date || '',
      visibility: gallery.visibility,
    })
    setEditing(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSavingEdit(true)
    try {
      await api.patch(`/galleries/${id}/`, {
        ...editForm,
        category: Number(editForm.category),
        department: editForm.department || null,
        event_date: editForm.event_date || null,
      })
      setEditing(false)
      setNotice('Gallery details updated.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update gallery details.'))
    } finally {
      setSavingEdit(false)
    }
  }

  const addItems = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setAdding(true)
    try {
      if (itemType === 'photo') {
        if (!files.length) throw new Error('Choose at least one image file first.')
        setUploadProgress({ done: 0, total: files.length })
        let failures = 0
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData()
          fd.append('item_type', 'photo')
          fd.append('image', files[i])
          if (targetAlbum) fd.append('album', targetAlbum)
          if (files.length === 1 && caption) fd.append('caption', caption)
          try {
            await api.post(`/galleries/${id}/items/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          } catch {
            failures += 1
          }
          setUploadProgress({ done: i + 1, total: files.length })
        }
        setNotice(failures ? `Uploaded ${files.length - failures} of ${files.length} (${failures} failed).` : `Uploaded ${files.length} photo${files.length === 1 ? '' : 's'}.`)
      } else {
        if (!videoUrl) throw new Error('Enter a video URL first.')
        const fd = new FormData()
        fd.append('item_type', 'video')
        fd.append('video_url', videoUrl)
        if (caption) fd.append('caption', caption)
        if (targetAlbum) fd.append('album', targetAlbum)
        if (videoThumb) fd.append('thumbnail', videoThumb)
        await api.post(`/galleries/${id}/items/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setNotice('Added.')
      }
      setFiles([])
      setVideoUrl('')
      setVideoThumb(null)
      setCaption('')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to add this item.'))
    } finally {
      setAdding(false)
      setUploadProgress(null)
    }
  }

  const removeItem = async (itemId) => {
    if (!confirm('Move this item to the recycle bin?')) return
    setError('')
    try {
      await api.delete(`/gallery-items/${itemId}/`)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to remove this item.'))
    }
  }

  const replaceImage = async (itemId, file) => {
    setError('')
    setNotice('')
    setReplacingId(itemId)
    try {
      const fd = new FormData()
      fd.append('image', file)
      await api.patch(`/gallery-items/${itemId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setNotice('Photo replaced.')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to replace this photo.'))
    } finally {
      setReplacingId(null)
    }
  }

  const openTagEdit = (item) => {
    setTagEditItem(item.id)
    setTagEditForm({ title: item.title || '', tags: (item.tags || []).join(', ') })
  }

  const saveTagEdit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.patch(`/gallery-items/${tagEditItem}/`, {
        title: tagEditForm.title,
        tags: tagEditForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setTagEditItem(null)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update this item.'))
    }
  }

  const createAlbum = async (e) => {
    e.preventDefault()
    if (!newAlbumName.trim()) return
    setError('')
    setCreatingAlbum(true)
    try {
      await api.post(`/galleries/${id}/albums/`, { name: newAlbumName })
      setNewAlbumName('')
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to create album.'))
    } finally {
      setCreatingAlbum(false)
    }
  }

  const removeAlbum = async (albumId) => {
    if (!confirm('Move this album to the recycle bin? Its photos/videos move to the recycle bin too.')) return
    setError('')
    try {
      await api.delete(`/albums/${albumId}/`)
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to delete album.'))
    }
  }

  const toggleAlbumPublish = async (album) => {
    setError('')
    try {
      await api.patch(`/albums/${album.id}/`, { status: album.status === 'published' ? 'draft' : 'published' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update album status.'))
    }
  }

  const togglePublish = async () => {
    setError('')
    try {
      await api.post(`/galleries/${id}/publish/`, { action: gallery.status === 'published' ? 'unpublish' : 'publish' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update publish status.'))
    }
  }

  const toggleArchive = async () => {
    setError('')
    try {
      await api.post(`/galleries/${id}/archive/`, { action: gallery.status === 'archived' ? 'restore' : 'archive' })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update gallery status.'))
    }
  }

  const toggleFeatured = async () => {
    setError('')
    try {
      await api.post(`/galleries/${id}/feature/`, { featured: !gallery.is_featured })
      load()
    } catch (err) {
      setError(readableError(err, 'Unable to update featured gallery.'))
    }
  }

  const duplicateGallery = async () => {
    setError('')
    setNotice('')
    try {
      const res = await api.post(`/galleries/${id}/duplicate/`)
      setNotice('Duplicated as a new draft.')
      navigate(`${basePath}/${res.data.id}`)
    } catch (err) {
      setError(readableError(err, 'Unable to duplicate gallery.'))
    }
  }

  const removeGallery = async () => {
    if (!confirm('Move this gallery to the recycle bin? You can restore it later.')) return
    try {
      await api.delete(`/galleries/${id}/`)
      navigate(basePath)
    } catch (err) {
      setError(readableError(err, 'Unable to delete gallery.'))
    }
  }

  const copyShareLink = async () => {
    const url = `${window.location.origin}/galleries/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setNotice('Gallery link copied to clipboard.')
    } catch {
      setNotice(url)
    }
  }

  if (!gallery) return <div className="container py-10">{error || 'Loading gallery...'}</div>

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Link to={basePath} className="text-sm text-slate-500 hover:text-slate-800">← All Galleries</Link>
            <h1 className="text-3xl font-bold mt-1">{gallery.title}</h1>
            <p className="text-slate-600 mt-1 text-sm">
              {gallery.category_name} · {gallery.department_name || 'No department'} · {gallery.visibility} ·{' '}
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[gallery.status] || 'bg-slate-100'}`}>{gallery.status}</span>
              {gallery.is_featured && <span className="ml-2 text-amber-700 font-semibold">★ Featured</span>}
            </p>
            {gallery.event_name && <p className="text-slate-500 text-sm mt-1">{gallery.event_name}{gallery.event_theme ? ` — "${gallery.event_theme}"` : ''}{gallery.event_location ? ` · ${gallery.event_location}` : ''}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={startEdit} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">Edit Details</button>
            <button onClick={copyShareLink} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">Copy Share Link</button>
            <button onClick={toggleFeatured} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">
              {gallery.is_featured ? 'Unfeature' : 'Feature on Homepage'}
            </button>
            <button onClick={togglePublish} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">
              {gallery.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={toggleArchive} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">
              {gallery.status === 'archived' ? 'Restore' : 'Archive'}
            </button>
            <button onClick={duplicateGallery} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold">Duplicate</button>
            <button onClick={removeGallery} className="rounded-2xl bg-red-500/15 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-500/25">Delete Gallery</button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-red-100 p-6 text-red-800">{error}</div>}
      {notice && <div className="rounded-3xl bg-green-100 p-6 text-green-800 break-all">{notice}</div>}

      {editing && editForm && (
        <form onSubmit={saveEdit} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xl font-semibold">Edit Gallery Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label>
              <span className="text-slate-700 text-sm">Title</span>
              <input required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Category</span>
              <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-slate-700 text-sm">Department (optional)</span>
              <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option value="">— None —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.ministry_name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-slate-700 text-sm">Event Date (optional)</span>
              <input type="date" value={editForm.event_date || ''} onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Event Name (optional)</span>
              <input value={editForm.event_name} onChange={(e) => setEditForm({ ...editForm, event_name: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Event Theme (optional)</span>
              <input value={editForm.event_theme} onChange={(e) => setEditForm({ ...editForm, event_theme: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Event Location (optional)</span>
              <input value={editForm.event_location} onChange={(e) => setEditForm({ ...editForm, event_location: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label>
              <span className="text-slate-700 text-sm">Visibility</span>
              <select value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
                <option value="public">Public</option>
                <option value="members">Members Only</option>
                <option value="admins">Administrators Only</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-slate-700 text-sm">Description (optional)</span>
              <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
          </div>
          <div className="flex gap-3">
            <button disabled={savingEdit} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold">Cancel</button>
          </div>
        </form>
      )}

      {tagEditItem && (
        <form onSubmit={saveTagEdit} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xl font-semibold">Edit Title / Tags</h2>
          <label className="block">
            <span className="text-slate-700 text-sm">Title</span>
            <input value={tagEditForm.title} onChange={(e) => setTagEditForm({ ...tagEditForm, title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <label className="block">
            <span className="text-slate-700 text-sm">Tags (comma-separated)</span>
            <input value={tagEditForm.tags} onChange={(e) => setTagEditForm({ ...tagEditForm, tags: e.target.value })} placeholder="worship, youth, 2026" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
          <div className="flex gap-3">
            <button type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold">Save</button>
            <button type="button" onClick={() => setTagEditItem(null)} className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold">Cancel</button>
          </div>
        </form>
      )}

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Albums ({gallery.albums?.length || 0})</h2>
        <form onSubmit={createAlbum} className="flex gap-3">
          <input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} placeholder="New album name, e.g. Day 1" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3" />
          <button disabled={creatingAlbum} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">Create Album</button>
        </form>
        {gallery.albums?.length > 0 && (
          <div className="grid gap-3">
            {gallery.albums.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-slate-500 text-sm ml-2">{a.photo_count} item{a.photo_count === 1 ? '' : 's'}</span>
                    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[a.status] || 'bg-slate-100'}`}>{a.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setExpandedAlbum(expandedAlbum === a.id ? null : a.id)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                      {expandedAlbum === a.id ? 'Hide' : 'View Items'}
                    </button>
                    <button onClick={() => toggleAlbumPublish(a)} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">
                      {a.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => removeAlbum(a.id)} className="rounded-full bg-red-500/15 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-500/25">Delete</button>
                  </div>
                </div>
                {expandedAlbum === a.id && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {(a.items || []).length === 0 ? (
                      <p className="text-slate-500 text-sm col-span-full">No items yet — use "Add Photos or Video" below and choose this album.</p>
                    ) : (
                      a.items.map((item) => (
                        <ItemCard key={item.id} item={item} onRemove={removeItem} onReplace={replaceImage} replacing={replacingId === item.id} onEditTags={openTagEdit} />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={addItems} className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-xl font-semibold">Add Photos or Video</h2>
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold w-fit">
          <button type="button" onClick={() => setItemType('photo')} className={`px-4 py-2 rounded-lg transition ${itemType === 'photo' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Photos</button>
          <button type="button" onClick={() => setItemType('video')} className={`px-4 py-2 rounded-lg transition ${itemType === 'video' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Video Link</button>
        </div>

        {gallery.albums?.length > 0 && (
          <label className="block">
            <span className="text-slate-700 text-sm">Add to</span>
            <select value={targetAlbum} onChange={(e) => setTargetAlbum(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3">
              <option value="">Gallery (no album)</option>
              {gallery.albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        )}

        {itemType === 'photo' ? (
          <label className="block">
            <span className="text-slate-700 text-sm">Image files — select multiple to bulk upload</span>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            {files.length > 1 && <p className="text-xs text-slate-500 mt-1">{files.length} files selected.</p>}
          </label>
        ) : (
          <>
            <label className="block">
              <span className="text-slate-700 text-sm">Video URL (YouTube, Vimeo, Facebook, etc.)</span>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
            <label className="block">
              <span className="text-slate-700 text-sm">Custom thumbnail (optional)</span>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setVideoThumb(e.target.files?.[0] || null)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>
          </>
        )}
        {(itemType === 'video' || files.length <= 1) && (
          <label className="block">
            <span className="text-slate-700 text-sm">Caption (optional)</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>
        )}
        <button disabled={adding} type="submit" className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-semibold disabled:opacity-60">
          {uploadProgress ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…` : adding ? 'Adding…' : itemType === 'photo' ? `Upload ${files.length > 1 ? `${files.length} Photos` : 'Photo'}` : 'Add Video'}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Items not in an album ({gallery.items?.length || 0})</h2>
        {!gallery.items?.length ? (
          <div className="text-slate-500 text-sm">No photos or videos here yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.items.map((item) => (
              <ItemCard key={item.id} item={item} onRemove={removeItem} onReplace={replaceImage} replacing={replacingId === item.id} onEditTags={openTagEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
