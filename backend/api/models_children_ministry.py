from django.conf import settings
from django.db import models


class GuardianProfile(models.Model):
    """A parent/guardian profile linked to an auth user account."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='guardian_profile',
    )

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name or getattr(self.user, 'username', '')


class ChildProfile(models.Model):
    """A child linked to one or more guardians."""

    name = models.CharField(max_length=255)
    gender = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Optional (e.g., Male/Female)'
    )
    date_of_birth = models.DateField(null=True, blank=True)

    guardians = models.ManyToManyField(
        GuardianProfile,
        related_name='children',
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ChildMedicalInfo(models.Model):
    """Medical/allergy info for a child (admin-managed)."""

    child = models.OneToOneField(
        ChildProfile,
        on_delete=models.CASCADE,
        related_name='medical_info',
    )

    allergies = models.TextField(blank=True, default='')
    medications = models.TextField(blank=True, default='')
    conditions = models.TextField(blank=True, default='')

    emergency_contact_name = models.CharField(max_length=255, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=30, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Medical: {self.child_id}"


class ChildAttendanceSession(models.Model):
    """Attendance session for a specific date/time."""

    title = models.CharField(max_length=255, blank=True, default='')
    session_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['session_date']),
        ]

    def __str__(self):
        return self.title or str(self.session_date)


class ChildAttendanceRecord(models.Model):
    """Attendance record per child per session."""

    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
    ]

    session = models.ForeignKey(
        ChildAttendanceSession,
        on_delete=models.CASCADE,
        related_name='records',
    )
    child = models.ForeignKey(
        ChildProfile,
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_marked_records',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['session', 'child'], name='unique_session_child_attendance'),
        ]
        indexes = [
            models.Index(fields=['session', 'child']),
        ]

    def __str__(self):
        return f"{self.child_id} @ {self.session_id}: {self.status}"

