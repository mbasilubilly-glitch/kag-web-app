from datetime import date

from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    MAX_DEPARTMENT_ADMINS, MIN_REQUIRED_ADMINS,
    DepartmentAdminAssignment, Event, EventRegistration,
    GalleryItem, MediaTeamMember,
    MemberMinistry, MemberProfile, Ministry, PrayerRequest, Sermon,
)
from .models_department_attendance import DepartmentAttendanceRecord
from .permissions import IsChurchAdmin
from .role_audit import RoleAuditLog


def _last_n_months(n):
    now = timezone.now()
    months = []
    y, m = now.year, now.month
    for _ in range(n):
        months.append((y, m))
        m -= 1
        if m == 0:
            m, y = 12, y - 1
    months.reverse()
    return months


def _department_stats(category):
    qs = Ministry.objects.filter(category=category, is_deleted=False)
    understaffed = (
        qs.annotate(admin_count=Count('admin_assignments', distinct=True))
        .filter(admin_count__lt=MIN_REQUIRED_ADMINS)
        .count()
    )
    return {
        'total': qs.count(),
        'active': qs.filter(status='active').count(),
        'understaffed': understaffed,
    }


class SystemAnalyticsSummaryView(APIView):
    """Church Admin / Super Admin: a cross-module overview of the whole
    system - membership growth, attendance, and content activity - each
    reusing that module's own existing data rather than a new, parallel
    tracking model."""

    permission_classes = [IsChurchAdmin]

    def get(self, request):
        months = _last_n_months(6)

        active_profiles = MemberProfile.objects.filter(status='ACTIVE')
        membership_growth = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': active_profiles.filter(created_at__year=y, created_at__month=m).count(),
            }
            for (y, m) in months
        ]
        total_members = User.objects.count()
        total_visitors = active_profiles.filter(role='Visitor').count()
        total_administrators = active_profiles.filter(role__in=['Administrator', 'Pastor']).count()
        pending_approvals = MemberProfile.objects.filter(status='PENDING_APPROVAL').count()

        attendance_records = DepartmentAttendanceRecord.objects.filter(status='present')
        attendance_trend = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': attendance_records.filter(
                    session__session_date__year=y, session__session_date__month=m,
                ).count(),
            }
            for (y, m) in months
        ]

        live_items = GalleryItem.objects.filter(is_deleted=False, gallery__is_deleted=False)
        content_trend = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': (
                    live_items.filter(created_at__year=y, created_at__month=m).count()
                    + Sermon.objects.filter(created_at__year=y, created_at__month=m).count()
                ),
            }
            for (y, m) in months
        ]

        ministries_stats = _department_stats('ministry')
        homecells_stats = _department_stats('homecell')

        media_team_ministry = Ministry.objects.filter(
            category='ministry', is_deleted=False, ministry_name='Media Team',
        ).first()
        media_team_admin_count = (
            DepartmentAdminAssignment.objects.filter(department=media_team_ministry).count()
            if media_team_ministry else 0
        )

        return Response({
            'total_members': total_members,
            'total_visitors': total_visitors,
            'total_administrators': total_administrators,
            'pending_approvals': pending_approvals,
            'membership_growth': membership_growth,
            'attendance_trend': attendance_trend,
            'content_trend': content_trend,
            'total_ministries_members': MemberMinistry.objects.filter(status='APPROVED').count(),
            'total_media_team_members': MediaTeamMember.objects.filter(status='APPROVED', is_active=True).count(),
            'ministries': ministries_stats,
            'homecells': homecells_stats,
            'media_team_understaffed': bool(media_team_ministry and media_team_admin_count < MIN_REQUIRED_ADMINS),
            'max_department_admins': MAX_DEPARTMENT_ADMINS,
        })


class ExecutiveDashboardSummaryView(APIView):
    """Church Executive Dashboard: the headline stats + chart series church
    leadership needs at a glance on first login, all in one call so the
    dashboard doesn't fan out into a dozen requests on load. Reuses the
    same modules/fields as SystemAnalyticsSummaryView above rather than any
    new parallel tracking model."""

    permission_classes = [IsChurchAdmin]

    def get(self, request):
        today = timezone.localdate()
        now = timezone.now()
        months = _last_n_months(6)
        month_labels = [date(y, m, 1).strftime('%b %Y') for (y, m) in months]

        active_profiles = MemberProfile.objects.filter(status='ACTIVE')
        present_records = DepartmentAttendanceRecord.objects.filter(status='present')

        # --- headline stats ---
        stats = {
            'total_members': active_profiles.exclude(role='Visitor').count(),
            'active_members': active_profiles.count(),
            'visitors': MemberProfile.objects.filter(role='Visitor').count(),
            'attendance_today': present_records.filter(session__session_date=today).count(),
            'upcoming_events': Event.objects.filter(date__gte=now).count(),
            'prayer_requests': PrayerRequest.objects.count(),
            'ministries': Ministry.objects.filter(category='ministry', is_deleted=False).count(),
            'homecell_fellowships': Ministry.objects.filter(category='homecell', is_deleted=False).count(),
            'baptized_members': MemberProfile.objects.filter(baptized=True).count(),
            'pending_registrations': MemberProfile.objects.filter(status='PENDING_APPROVAL').count(),
            'pending_ministry_requests': MemberMinistry.objects.filter(status='PENDING').count(),
        }

        # --- Row 1: Church Growth (line) ---
        church_growth = [
            {'label': label, 'value': active_profiles.filter(created_at__year=y, created_at__month=m).count()}
            for label, (y, m) in zip(month_labels, months)
        ]

        # --- Row 2: Attendance Analytics (bar) + Member Distribution (pie) ---
        attendance_analytics = [
            {
                'label': label,
                'value': present_records.filter(session__session_date__year=y, session__session_date__month=m).count(),
            }
            for label, (y, m) in zip(month_labels, months)
        ]

        member_distribution = [
            {'label': role_label, 'value': active_profiles.filter(role=role_key).count()}
            for role_key, role_label in MemberProfile.ROLE_CHOICES
        ]
        member_distribution = [row for row in member_distribution if row['value'] > 0]

        # --- Row 3: Ministry Performance (horizontal bar) + Homecell Growth (bar) ---
        ministry_performance = sorted(
            (
                {
                    'label': ministry.ministry_name,
                    'value': MemberMinistry.objects.filter(ministry=ministry, status='APPROVED').count(),
                }
                for ministry in Ministry.objects.filter(category='ministry', is_deleted=False)
            ),
            key=lambda row: row['value'],
            reverse=True,
        )[:8]

        homecell_growth = [
            {
                'label': label,
                'value': Ministry.objects.filter(
                    category='homecell', is_deleted=False, created_at__year=y, created_at__month=m,
                ).count(),
            }
            for label, (y, m) in zip(month_labels, months)
        ]

        # --- Row 4: Visitor Conversion (funnel) ---
        visitors_ever = MemberProfile.objects.filter(role='Visitor').count() + (
            RoleAuditLog.objects.filter(old_role='Visitor').values('target_user').distinct().count()
        )
        converted_to_member = RoleAuditLog.objects.filter(old_role='Visitor').exclude(new_role='Visitor').values('target_user').distinct().count()
        visitor_conversion = [
            {'label': 'Visitors', 'value': visitors_ever},
            {'label': 'Converted to Member', 'value': converted_to_member},
            {'label': 'Active Today', 'value': active_profiles.exclude(role='Visitor').count()},
        ]

        # --- Row 5: Prayer Statistics (bar) + Event Registration (line) ---
        prayer_statistics = [
            {'label': status_label, 'value': PrayerRequest.objects.filter(status=status_key).count()}
            for status_key, status_label in PrayerRequest.STATUS_CHOICES
        ]

        event_registration = [
            {
                'label': label,
                'value': EventRegistration.objects.filter(
                    status='Registered', created_at__year=y, created_at__month=m,
                ).count(),
            }
            for label, (y, m) in zip(month_labels, months)
        ]

        return Response({
            'stats': stats,
            'charts': {
                'church_growth': church_growth,
                'attendance_analytics': attendance_analytics,
                'member_distribution': member_distribution,
                'ministry_performance': ministry_performance,
                'homecell_growth': homecell_growth,
                'visitor_conversion': visitor_conversion,
                'prayer_statistics': prayer_statistics,
                'event_registration': event_registration,
            },
        })
