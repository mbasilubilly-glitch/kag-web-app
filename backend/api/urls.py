from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    ProfilePictureUploadView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
    SermonListCreateView,
    SermonDetailView,
    LiveStreamView,
    EventListCreateView,
    EventDetailView,
    EventRegistrationListCreateView,
    EventRegistrationDetailView,

    PrayerRequestListCreateView,
    PrayerRequestDetailView,
    MinistryDetailView,
    NotificationListCreateView,
    NotificationDetailView,
    DeviceTokenCreateView,
    PushSubscriptionRegisterView,

    DashboardSummaryView,
    MyActivitySummaryView,


    MemberProfileDetailView,
    PendingProfilesListView,
    MemberProfileApprovalView,
    ContactMessageListCreateView,
    ContactMessageDetailView,
    PushSendView,
    AdminResetPasswordView,
)

from .views_role import UserRolePatchView
from .views_auth_approval import LogoutView



from .views_homecells import HomecellListView, MemberDepartmentsRegisterView, MemberDepartmentsMeView
from .views_departments import MemberMinistriesListView, MemberDepartmentsSnapshotView
from .views_department_admin_assignments import (
    DepartmentAdminAssignmentListByDepartmentView,
    DepartmentAdminAssignmentCreateView,
    DepartmentAdminAssignmentDeleteView,
    DepartmentAdminCreateAccountView,
    MyDepartmentAdminAssignmentsView,
)
from .views_admin_provisioning import ChurchAdminListCreateView
from .views_gallery import (
    GalleryListCreateView,
    GalleryDetailView,
    GalleryArchiveView,
    GalleryPublishView,
    GalleryFeatureView,
    GalleryDuplicateView,
    AlbumListCreateView,
    AlbumDetailView,
    GalleryItemListCreateView,
    GalleryItemDetailView,
    GalleryItemMoveView,
)
from .views_gallery_categories import GalleryCategoryListCreateView, GalleryCategoryDetailView
from .views_gallery_recycle_bin import GalleryRecycleBinView, GalleryPermanentDeleteView, GalleryRestoreView
from .views_system_analytics import ExecutiveDashboardSummaryView, SystemAnalyticsSummaryView
from .views_media_team import (
    MediaTeamListCreateView,
    MediaTeamDetailView,
    MyMediaTeamMembershipView,
    MediaTeamJoinRequestView,
    MediaTeamJoinRequestsListView,
    MediaTeamJoinRequestDecisionView,
)
from .views_media_team_dashboard import MediaTeamDashboardSummaryView
from .views_ministry_members import (
    MinistryMembersListView,
    MinistryMemberSearchView,
    MinistryJoinRequestsListView,
    MinistryJoinRequestDecisionView,
    MinistryMemberAddView,
    MinistryMemberRemoveView,
)
from .views_audit_log import RoleAuditLogListView
from .views_announcements import AnnouncementListCreateView, AnnouncementDetailView
from .views_department_attendance import (
    DepartmentAttendanceSessionListCreateView,
    DepartmentAttendanceSessionDetailView,
    DepartmentAttendanceMarkView,
    DepartmentReportsSummaryView,
)
from .views_auth_google import GoogleAuthView
from .views_children_ministry import (

    GuardianProfileListCreateView,
    GuardianProfileDetailView,
    ChildProfileListCreateView,
    ChildProfileDetailView,
    ChildMedicalInfoUpsertView,
    AttendanceSessionListCreateView,
    AttendanceSessionDetailView,
    AttendanceMarkView,
)

# OTP endpoints
from .views_auth_otp import PasswordResetSendOTPView, PasswordResetConfirmOTPView
from .views_registration import MemberRegisterView, VisitorRegisterView

from .views_my_console import (
    MyEventRegistrationsView,
    MyPrayerRequestsView,
    MyAttendanceRecordsView,
)

from .views_security_questions import (
    MySecurityQuestionsView,
    SecurityQuestionsForIdentifierView,
    SecurityQuestionResetView,
)

from .views_online_meetings import (
    OnlineMeetingListCreateView,
    OnlineMeetingDetailView,
    OnlineMeetingJoinView,
    MyOnlineMeetingAttendanceStatsView,
    OnlineMeetingAttachmentListCreateView,
    OnlineMeetingAttachmentDetailView,
    OnlineMeetingPollListCreateView,
    OnlineMeetingPollVoteView,
    OnlineMeetingQuestionListCreateView,
    OnlineMeetingQuestionAnswerView,
    OnlineMeetingPrayerRequestListCreateView,
)

# Home Cell Fellowship Management
from .views_homecells_admin import (
    HomecellAdminListCreateView,
    HomecellAdminDetailView,
    HomecellArchiveView,
    HomecellRecycleBinView,
    HomecellRestoreView,
    HomecellPermanentDeleteView,
)
from .views_homecell_members import HomecellMemberAddView, HomecellMemberRemoveView
from .views_homecells_dashboard import HomecellDashboardSummaryView

# Church Ministries Management
from .views_ministries_admin import (
    MinistryAdminListCreateView,
    MinistryAdminDetailView,
    MinistryArchiveView,
    MinistryRecycleBinView,
    MinistryRestoreView,
    MinistryPermanentDeleteView,
)
from .views_ministries_dashboard import MinistryDashboardSummaryView

# Visitor -> Member self-service upgrade requests
from .views_membership_upgrade import (
    MembershipUpgradeRequestView,
    MyMembershipUpgradeStatusView,
    MembershipUpgradeRequestsListView,
    MembershipUpgradeDecisionView,
)



urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/register/member/', MemberRegisterView.as_view(), name='register_member'),
    path('auth/register/visitor/', VisitorRegisterView.as_view(), name='register_visitor'),

    # Google OAuth (Identity Services)
    path('auth/google/', GoogleAuthView.as_view(), name='auth_google'),

    # Password reset OTP
    path('auth/password-reset/send/', PasswordResetSendOTPView.as_view(), name='password_reset_send'),
    path('auth/password-reset/confirm/', PasswordResetConfirmOTPView.as_view(), name='password_reset_confirm'),

    # Password reset without email/SMS - security questions
    path('security-questions/mine/', MySecurityQuestionsView.as_view(), name='security_questions_mine'),
    path('auth/security-questions/', SecurityQuestionsForIdentifierView.as_view(), name='security_questions_for_identifier'),
    path('auth/security-questions/reset/', SecurityQuestionResetView.as_view(), name='security_questions_reset'),

    # Departments / Homecells / Ministries enrollment


    path('homecells/', HomecellListView.as_view(), name='homecell_list'),
    path('member-departments/me/', MemberDepartmentsMeView.as_view(), name='member_departments_me'),
    path('member-departments/register/', MemberDepartmentsRegisterView.as_view(), name='member_departments_register'),
    path('member-departments/snapshot/', MemberDepartmentsSnapshotView.as_view(), name='member_departments_snapshot'),
    path('ministries/', MemberMinistriesListView.as_view(), name='ministries_list'),

    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/profile/picture/', ProfilePictureUploadView.as_view(), name='profile_picture_upload'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/profile/', MemberProfileDetailView.as_view(), name='user_profile_detail'),
    path('sermons/', SermonListCreateView.as_view(), name='sermon_list'),
    path('sermons/<int:pk>/', SermonDetailView.as_view(), name='sermon_detail'),
    path('live-stream/', LiveStreamView.as_view(), name='live_stream'),
    path('events/', EventListCreateView.as_view(), name='event_list'),
    path('events/<int:pk>/', EventDetailView.as_view(), name='event_detail'),
    path('event-registrations/', EventRegistrationListCreateView.as_view(), name='event_registration_list'),
    path('event-registrations/<int:pk>/', EventRegistrationDetailView.as_view(), name='event_registration_detail'),
    path('event-registrations/mine/', MyEventRegistrationsView.as_view(), name='my_event_registrations'),

    path('prayer-requests/', PrayerRequestListCreateView.as_view(), name='prayer_request_list'),
    path('prayer-requests/<int:pk>/', PrayerRequestDetailView.as_view(), name='prayer_request_detail'),
    path('prayer-requests/mine/', MyPrayerRequestsView.as_view(), name='my_prayer_requests'),
    path('attendance/mine/', MyAttendanceRecordsView.as_view(), name='my_attendance_records'),
    path('ministries/<int:pk>/', MinistryDetailView.as_view(), name='ministry_detail'),
    path('ministries/<int:ministry_id>/members/', MinistryMembersListView.as_view(), name='ministry_members_list'),
    path('ministries/<int:ministry_id>/join-requests/', MinistryJoinRequestsListView.as_view(), name='ministry_join_requests_list'),
    path('ministries/<int:ministry_id>/join-requests/<int:request_id>/', MinistryJoinRequestDecisionView.as_view(), name='ministry_join_request_decision'),
    path('ministries/<int:ministry_id>/attendance/sessions/', DepartmentAttendanceSessionListCreateView.as_view(), name='department_attendance_sessions'),
    path('ministries/<int:ministry_id>/attendance/sessions/<int:session_id>/', DepartmentAttendanceSessionDetailView.as_view(), name='department_attendance_session_detail'),
    path('ministries/<int:ministry_id>/attendance/sessions/<int:session_id>/mark/', DepartmentAttendanceMarkView.as_view(), name='department_attendance_mark'),
    path('ministries/<int:ministry_id>/reports/summary/', DepartmentReportsSummaryView.as_view(), name='department_reports_summary'),

    # Online Meetings / Youth Sessions
    path('online-meetings/', OnlineMeetingListCreateView.as_view(), name='online_meeting_list'),
    path('online-meetings/my-attendance/', MyOnlineMeetingAttendanceStatsView.as_view(), name='online_meeting_my_attendance'),
    path('online-meetings/<int:pk>/', OnlineMeetingDetailView.as_view(), name='online_meeting_detail'),
    path('online-meetings/<int:pk>/join/', OnlineMeetingJoinView.as_view(), name='online_meeting_join'),
    path('online-meetings/<int:pk>/attachments/', OnlineMeetingAttachmentListCreateView.as_view(), name='online_meeting_attachments'),
    path('online-meetings/attachments/<int:pk>/', OnlineMeetingAttachmentDetailView.as_view(), name='online_meeting_attachment_detail'),
    path('online-meetings/<int:pk>/polls/', OnlineMeetingPollListCreateView.as_view(), name='online_meeting_polls'),
    path('online-meetings/polls/<int:pk>/vote/', OnlineMeetingPollVoteView.as_view(), name='online_meeting_poll_vote'),
    path('online-meetings/<int:pk>/questions/', OnlineMeetingQuestionListCreateView.as_view(), name='online_meeting_questions'),
    path('online-meetings/questions/<int:pk>/answer/', OnlineMeetingQuestionAnswerView.as_view(), name='online_meeting_question_answer'),
    path('online-meetings/<int:pk>/prayer-requests/', OnlineMeetingPrayerRequestListCreateView.as_view(), name='online_meeting_prayer_requests'),

    # Home Cell Fellowship Management (Church Admin / Super Admin CRUD +
    # lifecycle; homecells/<id>/members/ is the admin/leader-driven roster
    # add/remove - listing itself is served by ministries/<id>/members/,
    # which is category-aware for both ministries and homecells).
    path('admin/homecells/', HomecellAdminListCreateView.as_view(), name='homecell_admin_list_create'),
    path('admin/homecells/recycle-bin/', HomecellRecycleBinView.as_view(), name='homecell_recycle_bin'),
    path('admin/homecells/recycle-bin/restore/', HomecellRestoreView.as_view(), name='homecell_recycle_bin_restore'),
    path('admin/homecells/recycle-bin/permanent-delete/', HomecellPermanentDeleteView.as_view(), name='homecell_recycle_bin_permanent_delete'),
    path('admin/homecells/dashboard-summary/', HomecellDashboardSummaryView.as_view(), name='homecell_dashboard_summary'),
    path('admin/homecells/<int:pk>/', HomecellAdminDetailView.as_view(), name='homecell_admin_detail'),
    path('admin/homecells/<int:pk>/archive/', HomecellArchiveView.as_view(), name='homecell_archive'),
    path('homecells/<int:homecell_id>/members/', HomecellMemberAddView.as_view(), name='homecell_member_add'),
    path('homecells/<int:homecell_id>/members/<int:user_id>/', HomecellMemberRemoveView.as_view(), name='homecell_member_remove'),

    # Church Ministries Management (Church Admin / Super Admin CRUD +
    # lifecycle; membership add/remove happens via the join-request flow
    # above and Departments.jsx self-service, not a direct admin endpoint).
    path('admin/ministries/', MinistryAdminListCreateView.as_view(), name='ministry_admin_list_create'),
    path('admin/ministries/recycle-bin/', MinistryRecycleBinView.as_view(), name='ministry_recycle_bin'),
    path('admin/ministries/recycle-bin/restore/', MinistryRestoreView.as_view(), name='ministry_recycle_bin_restore'),
    path('admin/ministries/recycle-bin/permanent-delete/', MinistryPermanentDeleteView.as_view(), name='ministry_recycle_bin_permanent_delete'),
    path('admin/ministries/dashboard-summary/', MinistryDashboardSummaryView.as_view(), name='ministry_dashboard_summary'),
    path('admin/ministries/<int:pk>/', MinistryAdminDetailView.as_view(), name='ministry_admin_detail'),
    path('admin/ministries/<int:pk>/archive/', MinistryArchiveView.as_view(), name='ministry_archive'),
    path('ministries/<int:ministry_id>/members-manage/search/', MinistryMemberSearchView.as_view(), name='ministry_member_search'),
    path('ministries/<int:ministry_id>/members-manage/', MinistryMemberAddView.as_view(), name='ministry_member_add'),
    path('ministries/<int:ministry_id>/members-manage/<int:user_id>/', MinistryMemberRemoveView.as_view(), name='ministry_member_remove'),

    path('announcements/', AnnouncementListCreateView.as_view(), name='announcements_list_create'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement_detail'),
    path('role-audit-logs/', RoleAuditLogListView.as_view(), name='role_audit_log_list'),
    path('notifications/', NotificationListCreateView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification_detail'),
    path('device-tokens/', DeviceTokenCreateView.as_view(), name='device_token_create'),
    path('push-subscriptions/register/', PushSubscriptionRegisterView.as_view(), name='push_subscription_register'),
    path('push/send/', PushSendView.as_view(), name='push_send'),

    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('my-activity-summary/', MyActivitySummaryView.as_view(), name='my_activity_summary'),

    # Admin profile approvals
    path('profiles/pending/', PendingProfilesListView.as_view(), name='pending_profiles_list'),
    path('profiles/approval/', MemberProfileApprovalView.as_view(), name='member_profile_approval'),

    # Admin role assignment (SUPER_ADMIN)
    path('users/<int:pk>/role/', UserRolePatchView.as_view(), name='user_role_patch'),
    path('users/<int:pk>/reset-password/', AdminResetPasswordView.as_view(), name='user_reset_password'),

    # Contact messages
    path('contact-messages/', ContactMessageListCreateView.as_view(), name='contact_message_list_create'),
    path('contact-messages/<int:pk>/', ContactMessageDetailView.as_view(), name='contact_message_detail'),

    # Children Ministry
    path('guardians/', GuardianProfileListCreateView.as_view(), name='guardian_list'),
    path('guardians/<int:pk>/', GuardianProfileDetailView.as_view(), name='guardian_detail'),
    path('children/', ChildProfileListCreateView.as_view(), name='child_list'),
    path('children/<int:pk>/', ChildProfileDetailView.as_view(), name='child_detail'),
    path('children/<int:child_id>/medical/', ChildMedicalInfoUpsertView.as_view(), name='child_medical_info'),
    path('attendance/sessions/', AttendanceSessionListCreateView.as_view(), name='attendance_session_list'),
    path('attendance/sessions/<int:pk>/', AttendanceSessionDetailView.as_view(), name='attendance_session_detail'),
    path('attendance/sessions/<int:session_id>/mark/', AttendanceMarkView.as_view(), name='attendance_mark'),

    # Department Administrator assignment (Church Admin)
    path('department-admin-assignments/departments/<int:department_id>/', DepartmentAdminAssignmentListByDepartmentView.as_view(), name='department_admin_assignments_list_by_department'),
    path('department-admin-assignments/mine/', MyDepartmentAdminAssignmentsView.as_view(), name='department_admin_assignments_mine'),
    path('department-admin-assignments/', DepartmentAdminAssignmentCreateView.as_view(), name='department_admin_assignments_create'),
    path('department-admin-assignments/create-account/', DepartmentAdminCreateAccountView.as_view(), name='department_admin_assignments_create_account'),
    path('department-admin-assignments/<int:assignment_id>/', DepartmentAdminAssignmentDeleteView.as_view(), name='department_admin_assignments_delete'),

    # Church Administrator provisioning (Super Admin only)
    path('admin/church-admins/', ChurchAdminListCreateView.as_view(), name='church_admin_list_create'),

    # Photo/video galleries (public/members/admins visibility gated read,
    # Church Admin / Super Admin / Media Team / scoped Department Admin
    # manage). Unlimited galleries, each holding unlimited albums/items.
    path('galleries/recycle-bin/', GalleryRecycleBinView.as_view(), name='gallery_recycle_bin'),
    path('galleries/recycle-bin/restore/', GalleryRestoreView.as_view(), name='gallery_recycle_bin_restore'),
    path('galleries/recycle-bin/permanent-delete/', GalleryPermanentDeleteView.as_view(), name='gallery_recycle_bin_permanent_delete'),
    path('galleries/', GalleryListCreateView.as_view(), name='gallery_list_create'),
    path('galleries/<int:pk>/', GalleryDetailView.as_view(), name='gallery_detail'),
    path('galleries/<int:pk>/archive/', GalleryArchiveView.as_view(), name='gallery_archive'),
    path('galleries/<int:pk>/publish/', GalleryPublishView.as_view(), name='gallery_publish'),
    path('galleries/<int:pk>/feature/', GalleryFeatureView.as_view(), name='gallery_feature'),
    path('galleries/<int:pk>/duplicate/', GalleryDuplicateView.as_view(), name='gallery_duplicate'),
    path('galleries/<int:gallery_id>/albums/', AlbumListCreateView.as_view(), name='album_list_create'),
    path('albums/<int:pk>/', AlbumDetailView.as_view(), name='album_detail'),
    path('galleries/<int:gallery_id>/items/', GalleryItemListCreateView.as_view(), name='gallery_item_list_create'),
    path('gallery-items/<int:pk>/', GalleryItemDetailView.as_view(), name='gallery_item_detail'),
    path('gallery-items/<int:pk>/move/', GalleryItemMoveView.as_view(), name='gallery_item_move'),

    # Gallery categories (unlimited, admin-managed).
    path('gallery-categories/', GalleryCategoryListCreateView.as_view(), name='gallery_category_list_create'),
    path('gallery-categories/<int:pk>/', GalleryCategoryDetailView.as_view(), name='gallery_category_detail'),

    # Media Team (gallery-management permission grant, short of full Church Admin).
    path('admin/media-team/', MediaTeamListCreateView.as_view(), name='media_team_list_create'),
    path('admin/media-team/<int:pk>/', MediaTeamDetailView.as_view(), name='media_team_detail'),
    path('admin/media-team/dashboard-summary/', MediaTeamDashboardSummaryView.as_view(), name='media_team_dashboard_summary'),
    path('admin/analytics/system-summary/', SystemAnalyticsSummaryView.as_view(), name='system_analytics_summary'),
    path('admin/analytics/executive-summary/', ExecutiveDashboardSummaryView.as_view(), name='executive_dashboard_summary'),
    path('admin/media-team/join-requests/', MediaTeamJoinRequestsListView.as_view(), name='media_team_join_requests'),
    path('admin/media-team/join-requests/<int:pk>/', MediaTeamJoinRequestDecisionView.as_view(), name='media_team_join_request_decision'),
    path('media-team/join-request/', MediaTeamJoinRequestView.as_view(), name='media_team_join_request'),
    path('media-team/mine/', MyMediaTeamMembershipView.as_view(), name='media_team_mine'),

    # Visitor -> Member self-service upgrade requests (Church Admin approves/rejects)
    path('membership-upgrade/request/', MembershipUpgradeRequestView.as_view(), name='membership_upgrade_request'),
    path('membership-upgrade/mine/', MyMembershipUpgradeStatusView.as_view(), name='membership_upgrade_mine'),
    path('membership-upgrade/requests/', MembershipUpgradeRequestsListView.as_view(), name='membership_upgrade_requests_list'),
    path('membership-upgrade/requests/<int:user_id>/decision/', MembershipUpgradeDecisionView.as_view(), name='membership_upgrade_decision'),
]





