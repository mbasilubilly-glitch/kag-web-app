from datetime import date

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MIN_REQUIRED_ADMINS, DepartmentAdminAssignment, MemberMinistry, Ministry
from .models_department_attendance import DepartmentAttendanceRecord
from .permissions import IsChurchAdmin


class MinistryDashboardSummaryView(APIView):
    """Church Admin / Super Admin: church-wide Ministries overview - counts,
    leader/member/visitor totals, pending join requests, and the two chart
    series used by the Ministries Dashboard (Attendance by Ministry,
    Monthly Growth)."""

    permission_classes = [IsChurchAdmin]

    def get(self, request):
        ministries = Ministry.objects.filter(category='ministry', is_deleted=False)

        total = ministries.count()
        active = ministries.filter(status='active').count()
        inactive = ministries.filter(status='inactive').count()
        archived = ministries.filter(status='archived').count()

        assignments = DepartmentAdminAssignment.objects.filter(
            department__category='ministry', department__is_deleted=False,
        )
        total_leaders = assignments.filter(assignment_role='leader').count()
        total_assistant_leaders = assignments.filter(assignment_role='assistant_leader').count()

        understaffed_count = (
            ministries.annotate(admin_count=Count('admin_assignments', distinct=True))
            .filter(admin_count__lt=MIN_REQUIRED_ADMINS)
            .count()
        )

        approved_enrollments = MemberMinistry.objects.filter(ministry__is_deleted=False, status='APPROVED')
        total_members = approved_enrollments.count()
        pending_join_requests = MemberMinistry.objects.filter(ministry__is_deleted=False, status='PENDING').count()

        now = timezone.now()
        new_members_this_month = approved_enrollments.filter(
            created_at__year=now.year, created_at__month=now.month,
        ).count()

        attendance_records = DepartmentAttendanceRecord.objects.filter(
            session__ministry__category='ministry', session__ministry__is_deleted=False,
        )
        total_visitors = attendance_records.filter(status='visitor').count()

        attendance_by_ministry = list(
            ministries.annotate(
                present_count=Count(
                    'attendance_sessions__records',
                    filter=Q(attendance_sessions__records__status='present'),
                    distinct=True,
                )
            )
            .filter(present_count__gt=0)
            .values('ministry_name', 'present_count')
            .order_by('-present_count')[:10]
        )
        attendance_by_ministry = [
            {'label': row['ministry_name'], 'value': row['present_count'], 'count': row['present_count']}
            for row in attendance_by_ministry
        ]

        # New-members-per-month for the last 6 months (this month included).
        months = []
        y, m = now.year, now.month
        for _ in range(6):
            months.append((y, m))
            m -= 1
            if m == 0:
                m, y = 12, y - 1
        months.reverse()

        monthly_growth = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': approved_enrollments.filter(created_at__year=y, created_at__month=m).count(),
            }
            for (y, m) in months
        ]

        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'archived': archived,
            'total_leaders': total_leaders,
            'total_assistant_leaders': total_assistant_leaders,
            'total_members': total_members,
            'total_visitors': total_visitors,
            'pending_join_requests': pending_join_requests,
            'new_members_this_month': new_members_this_month,
            'understaffed_count': understaffed_count,
            'min_required_admins': MIN_REQUIRED_ADMINS,
            'attendance_by_ministry': attendance_by_ministry,
            'monthly_growth': monthly_growth,
        })
