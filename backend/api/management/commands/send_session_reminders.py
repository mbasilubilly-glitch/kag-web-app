from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import MemberMinistry, Notification, OnlineMeeting
from api.push_service import send_push_to_all, send_push_to_users


class Command(BaseCommand):
    """Sends a 'starts in ~30 minutes' Notification + push for every online
    session whose start falls in the next 25-35 minutes and hasn't already
    been reminded (reminder_sent_at guards against double-sending when this
    is run every few minutes via a scheduled task - see PWA/README.md for
    how to wire it up on Windows Task Scheduler / cron).

    Intended to run every 5-10 minutes: `python manage.py send_session_reminders`.
    """

    help = "Send a reminder notification/push for online sessions starting in ~30 minutes."

    def handle(self, *args, **options):
        now = timezone.now()
        window_start = now + timezone.timedelta(minutes=25)
        window_end = now + timezone.timedelta(minutes=35)

        candidates = OnlineMeeting.objects.filter(is_cancelled=False, reminder_sent_at__isnull=True)
        due = [m for m in candidates if window_start <= m.start_datetime <= window_end]

        sent_count = 0
        for meeting in due:
            Notification.objects.create(
                title=f'Starting soon: {meeting.title}',
                message=f'{meeting.title} starts at {meeting.start_time.strftime("%H:%M")}.',
            )
            try:
                if meeting.ministry_id:
                    member_ids = list(
                        MemberMinistry.objects.filter(ministry_id=meeting.ministry_id, status='APPROVED')
                        .values_list('user_id', flat=True)
                    )
                    if member_ids:
                        send_push_to_users(
                            'Session starting soon',
                            f'{meeting.title} starts at {meeting.start_time.strftime("%H:%M")}.',
                            member_ids,
                            url=f'/ministries/{meeting.ministry_id}/meetings',
                        )
                else:
                    send_push_to_all(
                        'Session starting soon',
                        f'{meeting.title} starts at {meeting.start_time.strftime("%H:%M")}.',
                        url='/dashboard',
                    )
            except RuntimeError:
                pass

            meeting.reminder_sent_at = now
            meeting.save(update_fields=['reminder_sent_at'])
            sent_count += 1

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_count} session reminder(s).'))
