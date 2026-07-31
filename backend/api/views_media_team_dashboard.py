from datetime import date, timedelta

from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DepartmentAdminAssignment, Event, Gallery, GalleryItem, MediaTeamMember, Ministry, Sermon
from .views_media_team import is_media_team_admin
from .permissions import is_media_team


class IsMediaTeamAdminOrMember(permissions.BasePermission):
    """Unlike IsMediaTeamAdmin (Leader/Assistant Leader or Church Admin
    only, used to gate roster mutations), the dashboard is read-only
    aggregate stats - safe for any approved Media Team member to view,
    not just its leadership."""

    def has_permission(self, request, view):
        return is_media_team_admin(request.user) or is_media_team(request.user)


class MediaTeamDashboardSummaryView(APIView):
    """Church Admin / Super Admin, the Media Team's own assigned Leader/
    Assistant Leader, or any approved Media Team member: overview -
    member/leader counts, pending join requests, and upload activity
    across Galleries and Sermons (the content Media Team members produce)."""

    permission_classes = [IsMediaTeamAdminOrMember]

    def get(self, request):
        members = MediaTeamMember.objects.filter(status='APPROVED')
        total_members = members.count()
        active_members = members.filter(is_active=True).count()
        pending_join_requests = MediaTeamMember.objects.filter(status='PENDING').count()

        media_team_ministry = Ministry.objects.filter(
            category='ministry', is_deleted=False, ministry_name='Media Team',
        ).first()
        leader_assignments = DepartmentAdminAssignment.objects.filter(department=media_team_ministry) if media_team_ministry else DepartmentAdminAssignment.objects.none()
        total_leaders = leader_assignments.filter(assignment_role='leader').count()
        total_assistant_leaders = leader_assignments.filter(assignment_role='assistant_leader').count()

        thirty_days_ago = timezone.now() - timedelta(days=30)

        live_items = GalleryItem.objects.filter(is_deleted=False, gallery__is_deleted=False)
        total_photos = live_items.filter(item_type='photo').count()
        total_videos = live_items.filter(item_type='video').count()
        total_sermons = Sermon.objects.count()

        recent_uploads = (
            live_items.filter(created_at__gte=thirty_days_ago).count()
            + Sermon.objects.filter(created_at__gte=thirty_days_ago).count()
        )

        # Content the Media Team hasn't finished publishing yet - a real,
        # actionable backlog metric (not everything uploaded is live).
        pending_media_publications = Gallery.objects.filter(status='draft', is_deleted=False).count()

        now = timezone.now()
        upcoming_church_services = Event.objects.filter(
            date__gte=now, date__lte=now + timedelta(days=7),
        ).count()

        # Role distribution across the roster - only meaningful once roles
        # are assigned, so unassigned members are bucketed separately
        # rather than silently dropped.
        role_counts = {}
        for member in members.exclude(role=''):
            role_counts[member.role] = role_counts.get(member.role, 0) + 1
        unassigned_count = members.filter(role='').count()
        if unassigned_count:
            role_counts['Unassigned'] = unassigned_count
        role_breakdown = [
            {'label': label, 'value': count, 'count': count}
            for label, count in sorted(role_counts.items(), key=lambda kv: -kv[1])
        ]

        # Upload trend (photos + videos + sermons combined) for the last 6
        # months, matching the Ministries/Home Cell dashboards' pattern.
        months = []
        y, m = now.year, now.month
        for _ in range(6):
            months.append((y, m))
            m -= 1
            if m == 0:
                m, y = 12, y - 1
        months.reverse()

        monthly_uploads = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': (
                    live_items.filter(created_at__year=y, created_at__month=m).count()
                    + Sermon.objects.filter(created_at__year=y, created_at__month=m).count()
                ),
            }
            for (y, m) in months
        ]

        # Recent activity feed: latest uploads and latest roster additions,
        # merged and sorted so admins see everything at a glance.
        activity = []
        for item in live_items.select_related('uploaded_by').order_by('-created_at')[:5]:
            uploader = item.uploaded_by
            uploader_name = (f'{uploader.first_name} {uploader.last_name}'.strip() or uploader.username) if uploader else 'Unknown'
            activity.append({
                'type': 'photo' if item.item_type == 'photo' else 'video',
                'label': f'{uploader_name} uploaded a {item.item_type}',
                'created_at': item.created_at,
            })
        for m in members.select_related('user').order_by('-created_at')[:5]:
            member_name = f'{m.user.first_name} {m.user.last_name}'.strip() or m.user.username
            activity.append({
                'type': 'member',
                'label': f'{member_name} joined the Media Team' + (f' as {m.role}' if m.role else ''),
                'created_at': m.created_at,
            })
        activity.sort(key=lambda a: a['created_at'], reverse=True)
        recent_activity = [
            {'type': a['type'], 'label': a['label'], 'created_at': a['created_at'].isoformat()}
            for a in activity[:8]
        ]

        return Response({
            'total_members': total_members,
            'active_members': active_members,
            'pending_join_requests': pending_join_requests,
            'total_leaders': total_leaders,
            'total_assistant_leaders': total_assistant_leaders,
            'total_photos': total_photos,
            'total_videos': total_videos,
            'total_sermons': total_sermons,
            'recent_uploads_last_30_days': recent_uploads,
            'pending_media_publications': pending_media_publications,
            'upcoming_church_services': upcoming_church_services,
            'role_breakdown': role_breakdown,
            'monthly_uploads': monthly_uploads,
            'recent_activity': recent_activity,
            'media_team_ministry_id': media_team_ministry.id if media_team_ministry else None,
        })
