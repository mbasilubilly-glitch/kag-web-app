import { Link, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function AdminLayout() {
  const { isSuperAdmin } = useAuth()

  return (
    <div className="container py-10">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Admin</h2>
          <nav className="flex flex-col gap-2 text-sm">
            {isSuperAdmin && (
              <Link to="/admin/church-admins" className="hover:text-slate-900">Church Administrators</Link>
            )}
            <Link to="/admin/membership" className="hover:text-slate-900">Membership List</Link>
            <Link to="/admin/users" className="hover:text-slate-900">Manage Users</Link>
            <Link to="/admin/sermons" className="hover:text-slate-900">Sermons</Link>
            <Link to="/admin/live" className="hover:text-slate-900">Live Stream</Link>
            <Link to="/admin/events" className="hover:text-slate-900">Events</Link>
            <Link to="/admin/ministries" className="hover:text-slate-900">Ministries</Link>
            <Link to="/admin/homecells" className="hover:text-slate-900">Home Cells</Link>
            <Link to="/admin/department-admin-assignments" className="hover:text-slate-900">Department Admins</Link>
            <Link to="/admin/announcements" className="hover:text-slate-900">Announcements</Link>
            <Link to="/admin/galleries" className="hover:text-slate-900">Galleries</Link>
            <Link to="/admin/gallery-categories" className="hover:text-slate-900">Gallery Categories</Link>
            <Link to="/admin/media-team" className="hover:text-slate-900">Media Team</Link>
            <Link to="/admin/audit-log" className="hover:text-slate-900">Audit Log</Link>

            <Link to="/admin/notifications" className="hover:text-slate-900">Notifications</Link>
            <Link to="/admin/contact-inbox" className="hover:text-slate-900">Contact Inbox</Link>
          </nav>

        </aside>
        <section className="md:col-span-3">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
