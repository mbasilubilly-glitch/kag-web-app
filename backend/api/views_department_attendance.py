from datetime import date

from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import Ministry, MemberHomecell, MemberMinistry
from .models_department_attendance import DepartmentAttendanceSession, DepartmentAttendanceRecord
from .serializers_department_attendance import (
    DepartmentAttendanceSessionSerializer,
    DepartmentAttendanceMarkRequestSerializer,
    DepartmentAttendanceSessionWithRecordsSerializer,
)
from .permissions import is_department_admin_for


class DepartmentAdminOnlyBase:
    permission_classes = [permissions.IsAuthenticated]

    def check_department_admin(self, request, ministry_id):
        if not is_department_admin_for(request.user, ministry_id):
            raise PermissionDenied('You do not administer this department.')


class DepartmentAttendanceSessionListCreateView(DepartmentAdminOnlyBase, generics.ListCreateAPIView):
    serializer_class = DepartmentAttendanceSessionSerializer

    def get_queryset(self):
        ministry_id = self.kwargs.get('ministry_id')
        self.check_department_admin(self.request, ministry_id)
        return DepartmentAttendanceSession.objects.filter(ministry_id=ministry_id).order_by('-session_date', '-created_at')

    def perform_create(self, serializer):
        ministry_id = self.kwargs.get('ministry_id')
        self.check_department_admin(self.request, ministry_id)
        serializer.save(ministry_id=ministry_id)


class DepartmentAttendanceSessionDetailView(DepartmentAdminOnlyBase, generics.RetrieveAPIView):
    serializer_class = DepartmentAttendanceSessionWithRecordsSerializer

    def get_object(self):
        ministry_id = self.kwargs.get('ministry_id')
        self.check_department_admin(self.request, ministry_id)
        try:
            return DepartmentAttendanceSession.objects.get(id=self.kwargs.get('session_id'), ministry_id=ministry_id)
        except DepartmentAttendanceSession.DoesNotExist:
            raise NotFound('Attendance session not found.')


class DepartmentAttendanceMarkView(DepartmentAdminOnlyBase, generics.GenericAPIView):
    serializer_class = DepartmentAttendanceMarkRequestSerializer

    @transaction.atomic
    def post(self, request, ministry_id, session_id):
        self.check_department_admin(request, ministry_id)

        try:
            session = DepartmentAttendanceSession.objects.get(id=session_id, ministry_id=ministry_id)
        except DepartmentAttendanceSession.DoesNotExist:
            raise NotFound('Attendance session not found.')
        mark_serializer = self.serializer_class(data=request.data)
        mark_serializer.is_valid(raise_exception=True)

        records = mark_serializer.validated_data['records']

        created = 0
        updated = 0
        for r in records:
            member_id = r['member_id']
            status_value = r['status']

            obj, was_created = DepartmentAttendanceRecord.objects.update_or_create(
                session=session,
                member_id=member_id,
                defaults={
                    'status': status_value,
                    'marked_by': request.user,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response(
            {
                'detail': 'Attendance marked.',
                'created': created,
                'updated': updated,
                'session_id': session.id,
            },
            status=status.HTTP_200_OK,
        )


STATUS_LABELS = {'present': 'Present', 'absent': 'Absent', 'excused': 'Excused', 'visitor': 'Visitor'}


class DepartmentReportsSummaryView(DepartmentAdminOnlyBase, generics.GenericAPIView):
    """Attendance trend, status breakdown, and member-growth chart data for
    a single Ministry/Home Cell Fellowship - powers the Reports tab (see
    MinistryReports.jsx, reused for both /ministries/:id/reports and
    /homecells/:id/reports)."""

    def get(self, request, ministry_id):
        self.check_department_admin(request, ministry_id)

        try:
            ministry = Ministry.objects.get(pk=ministry_id, is_deleted=False)
        except Ministry.DoesNotExist:
            raise NotFound('Ministry not found.')

        sessions = DepartmentAttendanceSession.objects.filter(ministry_id=ministry_id).order_by('session_date')
        records = DepartmentAttendanceRecord.objects.filter(session__ministry_id=ministry_id)

        # Attendance trend: present-count per session, most recent 12 sessions in date order.
        recent_sessions = list(sessions.order_by('-session_date')[:12])
        recent_sessions.reverse()
        attendance_trend = [
            {
                'label': s.session_date.strftime('%b %d'),
                'value': records.filter(session=s, status='present').count(),
            }
            for s in recent_sessions
        ]

        # Status breakdown across every session on record for this department.
        status_counts = dict(records.values_list('status').annotate(count=Count('id')))
        status_breakdown = [
            {'label': label, 'value': status_counts.get(key, 0), 'count': status_counts.get(key, 0)}
            for key, label in STATUS_LABELS.items()
            if status_counts.get(key, 0) > 0
        ]

        # Member growth: new enrollments per month, last 6 months. Homecells
        # use MemberHomecell (one cell per member); regular departments use
        # MemberMinistry, counting only approved joins.
        if ministry.category == 'homecell':
            enrollments = MemberHomecell.objects.filter(homecell_id=ministry_id)
        else:
            enrollments = MemberMinistry.objects.filter(ministry_id=ministry_id, status='APPROVED')

        now = timezone.now()
        months = []
        y, m = now.year, now.month
        for _ in range(6):
            months.append((y, m))
            m -= 1
            if m == 0:
                m, y = 12, y - 1
        months.reverse()

        member_growth = [
            {
                'label': date(y, m, 1).strftime('%b %Y'),
                'value': enrollments.filter(created_at__year=y, created_at__month=m).count(),
            }
            for (y, m) in months
        ]

        total_sessions = sessions.count()
        total_present = records.filter(status='present').count()
        average_attendance = round(total_present / total_sessions, 1) if total_sessions else 0

        return Response({
            'total_sessions': total_sessions,
            'total_members': enrollments.count(),
            'average_attendance': average_attendance,
            'attendance_trend': attendance_trend,
            'status_breakdown': status_breakdown,
            'member_growth': member_growth,
        })
