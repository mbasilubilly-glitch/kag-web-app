import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'

import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import Sermons from './pages/Sermons'
import SingleSermon from './pages/SingleSermon'

import Events from './pages/Events'
import SingleEvent from './pages/SingleEvent'
import Worship from './pages/Worship'
import Live from './pages/Live'

import DreamCentre from './pages/DreamCentre'
import Campus from './pages/Campus'
import Contact from './pages/Contact'
import SignIn from './pages/SignIn'
import AdminLogin from './pages/AdminLogin'
import RegisterChoice from './pages/RegisterChoice'
import RegisterMember from './pages/RegisterMember'
import RegisterVisitor from './pages/RegisterVisitor'
import ForgotPassword from './pages/ForgotPassword'
import SecurityQuestionReset from './pages/SecurityQuestionReset'
import MyConsoleDashboard from './pages/MyConsoleDashboard'
import MyConsoleEvents from './pages/MyConsoleEvents'
import MyConsolePrayerRequests from './pages/MyConsolePrayerRequests'
import MyConsoleAttendance from './pages/MyConsoleAttendance'

import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import PrayerRequest from './pages/PrayerRequest'
import EventRegistration from './pages/EventRegistration'

import AdminPanel from './pages/AdminPanel'
import AdminChurchAdmins from './pages/AdminChurchAdmins'
import AdminMembershipList from './pages/AdminMembershipList'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetail from './pages/AdminUserDetail'
import AdminMembershipRequests from './pages/AdminMembershipRequests'
import AdminLayout from './pages/AdminLayout'
import AdminSermons from './pages/AdminSermons'
import AdminSermonEdit from './pages/AdminSermonEdit'
import AdminEvents from './pages/AdminEvents'
import AdminEventEdit from './pages/AdminEventEdit'
import AdminMinistries from './pages/AdminMinistries'
import AdminAnnouncements from './pages/AdminAnnouncements'
import Announcements from './pages/Announcements'
import AdminGalleries from './pages/AdminGalleries'
import AdminGalleryDetail from './pages/AdminGalleryDetail'
import Galleries from './pages/Galleries'
import GalleryDetail from './pages/GalleryDetail'
import AdminMediaTeam from './pages/AdminMediaTeam'
import AdminMediaTeamDashboard from './pages/AdminMediaTeamDashboard'
import MediaTeamGuard from './components/MediaTeamGuard'
import AdminSystemAnalytics from './pages/AdminSystemAnalytics'
import AdminGalleryCategories from './pages/AdminGalleryCategories'
import AdminGalleryRecycleBin from './pages/AdminGalleryRecycleBin'
import AdminAuditLog from './pages/AdminAuditLog'
import AdminLiveStream from './pages/AdminLiveStream'

import AdminNotifications from './pages/AdminNotifications'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import Notifications from './pages/Notifications'
import EnableNotifications from './pages/EnableNotifications'
import Departments from './pages/Departments'
import MyHomecell from './pages/MyHomecell'
import Ministries from './pages/Ministries'
import SingleMinistry from './pages/SingleMinistry'
import MinistryDashboard from './pages/MinistryDashboard'
import MinistryMembers from './pages/MinistryMembers'

import MinistryAttendance from './pages/MinistryAttendance'
import MinistryEvents from './pages/MinistryEvents'
import MinistryOnlineMeetings from './pages/MinistryOnlineMeetings'
import SingleOnlineMeeting from './pages/SingleOnlineMeeting'
import MinistryCalendar from './pages/MinistryCalendar'
import MinistryAnnouncements from './pages/MinistryAnnouncements'
import MinistryPrayerRequests from './pages/MinistryPrayerRequests'
import MinistryResources from './pages/MinistryResources'
import MinistryReports from './pages/MinistryReports'
import MinistrySettings from './pages/MinistrySettings'

import ProtectedRoute from './components/ProtectedRoute'
import AdminContactInbox from './pages/AdminContactInbox'
import AdminDepartmentAdminAssignments from './pages/AdminDepartmentAdminAssignments'
import AdminHomeCells from './pages/AdminHomeCells'
import AdminHomeCellDetail from './pages/AdminHomeCellDetail'
import AdminHomeCellRecycleBin from './pages/AdminHomeCellRecycleBin'
import AdminHomeCellDashboard from './pages/AdminHomeCellDashboard'
import AdminMinistryDetail from './pages/AdminMinistryDetail'
import AdminMinistryRecycleBin from './pages/AdminMinistryRecycleBin'
import AdminMinistryDashboard from './pages/AdminMinistryDashboard'





import { useEffect } from 'react'

import { isProbablyOnline, waitForOnline } from './utils/onlineGuard'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const maybeRecover = async () => {
      try {
        if (!isProbablyOnline()) return
        if (typeof window !== 'undefined' && window.location?.pathname === '/offline.html') {
          await waitForOnline({ timeoutMs: 15000 }).catch(() => {})
          window.location.assign('/')
          return
        }
      } catch (_) {
        // ignore
      }
    }

    window.addEventListener('online', maybeRecover)
    return () => window.removeEventListener('online', maybeRecover)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar with mobile toggle support (fixed-position; the md:pl-72
            below reserves space for it since fixed elements don't take up
            room in normal flow) */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col md:pl-72">
          {/* Navbar visible on desktop */}
          <div className="hidden md:block">
            <Navbar />
          </div>

          {/* Mobile header with hamburger */}
          <div className="md:hidden bg-gradient-to-r from-primary-700 to-primary-600 sticky top-0 z-10 border-b-4 border-secondary-500">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-white p-2 hover:bg-primary-600/50 rounded-lg transition"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary-400 flex items-center justify-center text-primary-700 font-bold text-sm">
                  K
                </div>
                <span className="text-white font-bold text-sm">KAG Unity</span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/sermons" element={<Sermons />} />
              <Route path="/sermons/:id" element={<SingleSermon />} />

              <Route path="/galleries" element={<Galleries />} />
              <Route path="/galleries/:id" element={<GalleryDetail />} />

              {/* Media Team console - gallery management for users granted
                  that permission without being full Church Admins, so this
                  is a plain login-gated route (not adminOnly) outside
                  /admin/*; the backend enforces the real permission. */}
              <Route
                path="/media-team/galleries"
                element={
                  <ProtectedRoute>
                    <AdminGalleries basePath="/media-team/galleries" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/galleries/recycle-bin"
                element={
                  <ProtectedRoute>
                    <AdminGalleryRecycleBin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/galleries/:id"
                element={
                  <ProtectedRoute>
                    <AdminGalleryDetail basePath="/media-team/galleries" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/gallery-categories"
                element={
                  <ProtectedRoute>
                    <AdminGalleryCategories />
                  </ProtectedRoute>
                }
              />

              {/* Media Team can also manage sermons (video/audio content) -
                  same plain login-gated pattern as the gallery routes above;
                  the backend's IsChurchAdminOrMediaTeam enforces the real
                  permission. */}
              <Route
                path="/media-team/sermons"
                element={
                  <ProtectedRoute>
                    <AdminSermons basePath="/media-team/sermons" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/sermons/new"
                element={
                  <ProtectedRoute>
                    <AdminSermonEdit basePath="/media-team/sermons" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/sermons/:id/edit"
                element={
                  <ProtectedRoute>
                    <AdminSermonEdit basePath="/media-team/sermons" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/live"
                element={
                  <ProtectedRoute>
                    <AdminLiveStream />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/events"
                element={
                  <ProtectedRoute>
                    <AdminEvents basePath="/media-team/events" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/events/new"
                element={
                  <ProtectedRoute>
                    <AdminEventEdit basePath="/media-team/events" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-team/events/:id/edit"
                element={
                  <ProtectedRoute>
                    <AdminEventEdit basePath="/media-team/events" />
                  </ProtectedRoute>
                }
              />

              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<SingleEvent />} />
              <Route path="/events/:id/register" element={<EventRegistration />} />
              <Route path="/prayer-request" element={<PrayerRequest />} />

              <Route path="/live" element={<Live />} />
              <Route path="/worship" element={<Worship />} />

              <Route path="/dream-centre" element={<DreamCentre />} />
              <Route path="/campus" element={<Campus />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/register" element={<RegisterChoice />} />
              <Route path="/register/member" element={<RegisterMember />} />
              <Route path="/register/visitor" element={<RegisterVisitor />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/forgot-password/security-questions" element={<SecurityQuestionReset />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/departments"
                element={
                  <ProtectedRoute>
                    <Departments />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-homecell"
                element={
                  <ProtectedRoute>
                    <MyHomecell />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries"
                element={
                  <ProtectedRoute>
                    <Ministries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ministries/:id"
                element={
                  <ProtectedRoute>
                    <SingleMinistry />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-console"
                element={
                  <ProtectedRoute>
                    <MyConsoleDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-console/events"
                element={
                  <ProtectedRoute>
                    <MyConsoleEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-console/prayer-requests"
                element={
                  <ProtectedRoute>
                    <MyConsolePrayerRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-console/attendance"
                element={
                  <ProtectedRoute>
                    <MyConsoleAttendance />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications/enable"
                element={
                  <ProtectedRoute>
                    <EnableNotifications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/announcements"
                element={
                  <ProtectedRoute>
                    <Announcements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/dashboard"
                element={
                  <ProtectedRoute>
                    <MinistryDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/media-team/dashboard"
                element={
                  <ProtectedRoute>
                    <MediaTeamGuard requireLeader={false}>
                      <AdminMediaTeamDashboard basePath="/media-team" />
                    </MediaTeamGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/media-team/manage"
                element={
                  <ProtectedRoute>
                    <MediaTeamGuard>
                      <AdminMediaTeam basePath="/media-team" />
                    </MediaTeamGuard>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/members"
                element={
                  <ProtectedRoute>
                    <MinistryMembers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/attendance"
                element={
                  <ProtectedRoute>
                    <MinistryAttendance />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/events"
                element={
                  <ProtectedRoute>
                    <MinistryEvents />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/meetings"
                element={
                  <ProtectedRoute>
                    <MinistryOnlineMeetings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/online-meetings/:id"
                element={
                  <ProtectedRoute>
                    <SingleOnlineMeeting />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/calendar"
                element={
                  <ProtectedRoute>
                    <MinistryCalendar />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/announcements"
                element={
                  <ProtectedRoute>
                    <MinistryAnnouncements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/prayer-requests"
                element={
                  <ProtectedRoute>
                    <MinistryPrayerRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/resources"
                element={
                  <ProtectedRoute>
                    <MinistryResources />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/reports"
                element={
                  <ProtectedRoute>
                    <MinistryReports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ministries/:id/settings"
                element={
                  <ProtectedRoute>
                    <MinistrySettings />
                  </ProtectedRoute>
                }
              />

              {/* Home Cell Leader console - homecells are Ministry rows
                  too (category='homecell'), so these reuse the exact same
                  console page components as /ministries/:id/... above;
                  MinistryConsoleNav tells the two contexts apart by URL. */}
              <Route
                path="/homecells/:id/dashboard"
                element={
                  <ProtectedRoute>
                    <MinistryDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/members"
                element={
                  <ProtectedRoute>
                    <MinistryMembers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/attendance"
                element={
                  <ProtectedRoute>
                    <MinistryAttendance />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/events"
                element={
                  <ProtectedRoute>
                    <MinistryEvents />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/meetings"
                element={
                  <ProtectedRoute>
                    <MinistryOnlineMeetings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/calendar"
                element={
                  <ProtectedRoute>
                    <MinistryCalendar />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/announcements"
                element={
                  <ProtectedRoute>
                    <MinistryAnnouncements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/prayer-requests"
                element={
                  <ProtectedRoute>
                    <MinistryPrayerRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/resources"
                element={
                  <ProtectedRoute>
                    <MinistryResources />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/reports"
                element={
                  <ProtectedRoute>
                    <MinistryReports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/homecells/:id/settings"
                element={
                  <ProtectedRoute>
                    <MinistrySettings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminPanel />} />
                <Route path="church-admins" element={<AdminChurchAdmins />} />
                <Route path="membership" element={<AdminMembershipList />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="membership-requests" element={<AdminMembershipRequests />} />
                <Route path="sermons" element={<AdminSermons />} />
                <Route path="sermons/new" element={<AdminSermonEdit />} />
                <Route path="sermons/:id/edit" element={<AdminSermonEdit />} />
                <Route path="live" element={<AdminLiveStream />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/new" element={<AdminEventEdit />} />
                <Route path="events/:id/edit" element={<AdminEventEdit />} />
                <Route path="ministries" element={<AdminMinistries />} />
                <Route path="ministries/dashboard" element={<AdminMinistryDashboard />} />
                <Route path="ministries/recycle-bin" element={<AdminMinistryRecycleBin />} />
                <Route path="ministries/:id" element={<AdminMinistryDetail />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="galleries" element={<AdminGalleries />} />
                <Route path="galleries/recycle-bin" element={<AdminGalleryRecycleBin />} />
                <Route path="galleries/:id" element={<AdminGalleryDetail />} />
                <Route path="gallery-categories" element={<AdminGalleryCategories />} />
                <Route path="media-team" element={<AdminMediaTeam />} />
                <Route path="media-team/dashboard" element={<AdminMediaTeamDashboard />} />
                <Route path="analytics" element={<AdminSystemAnalytics />} />
                <Route path="audit-log" element={<AdminAuditLog />} />
                <Route path="department-admin-assignments" element={<AdminDepartmentAdminAssignments />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="contact-inbox" element={<AdminContactInbox />} />
                <Route path="homecells" element={<AdminHomeCells />} />
                <Route path="homecells/dashboard" element={<AdminHomeCellDashboard />} />
                <Route path="homecells/recycle-bin" element={<AdminHomeCellRecycleBin />} />
                <Route path="homecells/:id" element={<AdminHomeCellDetail />} />
              </Route>


              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />

              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App