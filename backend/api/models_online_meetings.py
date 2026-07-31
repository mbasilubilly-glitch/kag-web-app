from datetime import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone


class OnlineMeeting(models.Model):
    """A Bible study / fellowship / mentorship / prayer session held online.
    Null ministry = church-wide, set = department-owned - same convention
    as Event.ministry."""

    PLATFORM_CHOICES = [
        ('google_meet', 'Google Meet'),
        ('zoom', 'Zoom'),
        ('teams', 'Microsoft Teams'),
        ('built_in', 'Built-in Video Meeting'),
    ]

    ministry = models.ForeignKey(
        'api.Ministry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='online_meetings',
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    speaker = models.CharField(max_length=255, blank=True, default='')
    theme = models.CharField(max_length=255, blank=True, default='')
    scripture_reference = models.CharField(max_length=255, blank=True, default='')

    meeting_link = models.URLField()
    meeting_platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='google_meet')

    meeting_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_cancelled = models.BooleanField(default=False)
    recording_url = models.URLField(blank=True, default='')

    # Set by send_session_reminders once a reminder notification has gone
    # out for this session, so re-running the command within the same
    # 25-35 minute window doesn't notify members twice.
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_online_meetings',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-meeting_date', '-start_time']
        indexes = [
            models.Index(fields=['ministry', 'meeting_date']),
        ]

    def __str__(self):
        return self.title

    @property
    def start_datetime(self):
        return timezone.make_aware(datetime.combine(self.meeting_date, self.start_time))

    @property
    def end_datetime(self):
        return timezone.make_aware(datetime.combine(self.meeting_date, self.end_time))

    @property
    def status(self):
        """Always computed from the clock, never stored - a stored field
        would drift without a scheduler tick we don't want to depend on."""
        if self.is_cancelled:
            return 'Cancelled'
        now = timezone.now()
        if now < self.start_datetime:
            return 'Upcoming'
        if now <= self.end_datetime:
            return 'Live'
        return 'Ended'

    @property
    def is_joinable(self):
        """Join opens 10 minutes before start and stays open until end."""
        if self.is_cancelled:
            return False
        now = timezone.now()
        join_opens = self.start_datetime - timezone.timedelta(minutes=10)
        return join_opens <= now <= self.end_datetime


class OnlineMeetingAttachment(models.Model):
    """PDF/PowerPoint/Bible study guide/notes attached to a session."""

    meeting = models.ForeignKey(OnlineMeeting, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='online_meeting_attachments/')
    label = models.CharField(max_length=255, blank=True, default='')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.label or self.file.name


class OnlineMeetingAttendance(models.Model):
    """Member-initiated 'I joined this meeting' record, created by the join
    endpoint itself - not admin-marked like DepartmentAttendanceRecord."""

    meeting = models.ForeignKey(OnlineMeeting, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='online_meeting_attendances')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['meeting', 'user'], name='unique_meeting_attendance'),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.meeting_id}"


class OnlineMeetingPoll(models.Model):
    meeting = models.ForeignKey(OnlineMeeting, on_delete=models.CASCADE, related_name='polls')
    question = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question


class OnlineMeetingPollOption(models.Model):
    poll = models.ForeignKey(OnlineMeetingPoll, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)

    def __str__(self):
        return self.option_text


class OnlineMeetingPollVote(models.Model):
    poll = models.ForeignKey(OnlineMeetingPoll, on_delete=models.CASCADE, related_name='votes')
    option = models.ForeignKey(OnlineMeetingPollOption, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='online_meeting_poll_votes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['poll', 'user'], name='unique_poll_vote_per_user'),
        ]

    def __str__(self):
        return f"{self.user_id} -> {self.option_id}"


class OnlineMeetingQuestion(models.Model):
    meeting = models.ForeignKey(OnlineMeeting, on_delete=models.CASCADE, related_name='questions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='online_meeting_questions')
    question_text = models.TextField()
    answer_text = models.TextField(blank=True, default='')
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.question_text[:80]
