from django.conf import settings
from django.db import models


class DepartmentAttendanceSession(models.Model):
    """Attendance session for a ministry/department, for a specific date/time."""

    ministry = models.ForeignKey(
        'api.Ministry',
        on_delete=models.CASCADE,
        related_name='attendance_sessions',
    )

    title = models.CharField(max_length=255, blank=True, default='')
    session_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['ministry', 'session_date']),
        ]

    def __str__(self):
        return self.title or str(self.session_date)


class DepartmentAttendanceRecord(models.Model):
    """Attendance record per enrolled member per department attendance session."""

    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('excused', 'Excused'),
        ('visitor', 'Visitor'),
    ]

    session = models.ForeignKey(
        DepartmentAttendanceSession,
        on_delete=models.CASCADE,
        related_name='records',
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='department_attendance_records',
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='department_attendance_marked_records',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['session', 'member'], name='unique_session_member_attendance'),
        ]
        indexes = [
            models.Index(fields=['session', 'member']),
        ]

    def __str__(self):
        return f"{self.member_id} @ {self.session_id}: {self.status}"
