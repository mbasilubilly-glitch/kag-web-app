import io

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import models
from PIL import Image

# OTP models (DB-backed)
from .models_auth_models import PasswordResetOTP, BlacklistedAccessToken  # noqa: F401


MAX_UPLOAD_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB


def validate_image_upload_size(file):
    """Rejects a single upload past MAX_UPLOAD_IMAGE_BYTES before it's ever
    written to disk - without this, DRF/Django will happily buffer and save
    an arbitrarily large file, making every image upload endpoint a cheap
    disk/bandwidth exhaustion vector. Runs automatically wherever this is
    attached to a model field: DRF's ModelSerializer copies model field
    validators onto the generated serializer field, so this covers every
    serializer-backed upload for free - the one upload path that bypasses a
    serializer (ProfilePictureUploadView) calls it explicitly instead."""
    if file.size > MAX_UPLOAD_IMAGE_BYTES:
        raise ValidationError(
            f'Image too large ({file.size // (1024 * 1024)} MB) - maximum is '
            f'{MAX_UPLOAD_IMAGE_BYTES // (1024 * 1024)} MB.'
        )


def compress_image(image_field, max_dimension=1920, quality=85):
    """Resize (if larger than max_dimension on its longest side) and
    re-encode as JPEG, so gallery uploads don't balloon storage/load time.
    Returns None if there's nothing to compress."""
    if not image_field:
        return None
    image_field.seek(0)
    img = Image.open(image_field)
    img = img.convert('RGB')
    if max(img.size) > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=quality, optimize=True)
    buffer.seek(0)
    name = image_field.name.rsplit('.', 1)[0] + '.jpg'
    return ContentFile(buffer.read(), name=name)

# Role change audit trail — imported here (not just from views_role.py) so
# Django's migration autodetector always sees it as part of this app; without
# this import, `makemigrations` cannot see the model during management
# commands and proposes dropping its table.
from .role_audit import RoleAuditLog  # noqa: F401

from .models_department_attendance import DepartmentAttendanceSession, DepartmentAttendanceRecord  # noqa: F401

from .models_security_questions import SecurityQuestion  # noqa: F401

from .models_online_meetings import (  # noqa: F401
    OnlineMeeting,
    OnlineMeetingAttachment,
    OnlineMeetingAttendance,
    OnlineMeetingPoll,
    OnlineMeetingPollOption,
    OnlineMeetingPollVote,
    OnlineMeetingQuestion,
)


class Announcement(models.Model):
    """Church-wide (ministry=None) or department-scoped announcement."""

    title = models.CharField(max_length=255)
    body = models.TextField()
    poster = models.ImageField(upload_to='announcements/posters/', null=True, blank=True, validators=[validate_image_upload_size])
    ministry = models.ForeignKey(
        'api.Ministry',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcements',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Sermon(models.Model):
    title = models.CharField(max_length=255)
    # Blank is legitimate for an archived "Live Recording" - a whole
    # service's recording doesn't always have one distinct speaker on hand
    # at archive time, unlike a regular single-message sermon.
    speaker = models.CharField(max_length=150, blank=True, default='')
    category = models.CharField(max_length=100)
    video_url = models.URLField(blank=True, null=True)
    audio_url = models.URLField(blank=True, null=True)
    notes_url = models.URLField(blank=True, null=True)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class LiveStream(models.Model):
    """Singleton (always pk=1) holding the church's permanent channel-live
    link (e.g. a YouTube channel's /live URL or Facebook Page's /live URL),
    set once by a Church Admin or Media Team member. The public Live page
    embeds this link directly and displays automatically whenever that
    channel is actually broadcasting - no per-stream toggle to remember."""

    url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)

    # Manually toggled via LiveStreamGoLiveView/LiveStreamEndView (see
    # views.py) - not detected through any external API. Drives the "LIVE
    # NOW" badge on the public Live page and admin panel.
    is_live = models.BooleanField(default=False)

    def __str__(self):
        return f"LiveStream(is_live={self.is_live})"


class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()
    venue = models.CharField(max_length=255)
    image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Null means church-wide; set means the event belongs to a specific
    # ministry/department, created by that department's admin.
    ministry = models.ForeignKey(
        'api.Ministry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
    )

    def __str__(self):
        return self.title

class EventRegistration(models.Model):
    """Attendee registration for an event."""
    # Nullable: EventRegistration.jsx is a public, unauthenticated page (name
    # + phone only, no login) - most registrants have no account at all.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    full_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(
        max_length=50,
        choices=[('Registered', 'Registered'), ('Cancelled', 'Cancelled')],
        default='Registered',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        name = self.full_name or (self.user.username if self.user else 'Guest')
        return f"{name} - {self.event.title}"

class PrayerRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Answered', 'Answered'),
        ('In Progress', 'In Progress'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    request = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    # Optional link to an online meeting/session this prayer request was
    # raised during - lets a meeting page show its own prayer requests
    # while the request still shows up in the church-wide admin list too.
    meeting = models.ForeignKey(
        'api.OnlineMeeting',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prayer_requests',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prayer request from {self.user or 'Guest'}"

class Ministry(models.Model):
    CATEGORY_CHOICES = [
        ('ministry', 'Ministry / Department'),
        ('homecell', 'Homecell'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]

    MEETING_DAY_CHOICES = [
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    ministry_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    # Free-text display field, kept for backward compat - the real,
    # permission-bearing Home Cell Leader is a DepartmentAdminAssignment
    # (assignment_role='leader'), not this field.
    leader = models.CharField(max_length=150, blank=True, default='')
    # Homecells get every department feature (admin assignment, attendance,
    # events, announcements) for free by being Ministry rows tagged
    # category='homecell', rather than a parallel, feature-poor model.
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='ministry')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- Home Cell Fellowship fields (also usable by category='ministry'
    # rows, but populated mainly for homecells - see ARCHITECTURE.md). ---
    meeting_day = models.CharField(max_length=20, choices=MEETING_DAY_CHOICES, blank=True, default='')
    meeting_time = models.TimeField(null=True, blank=True)
    meeting_venue = models.CharField(max_length=255, blank=True, default='')
    physical_address = models.TextField(blank=True, default='')
    area_location = models.CharField(max_length=150, blank=True, default='')
    county = models.CharField(max_length=100, blank=True, default='')
    church_branch = models.CharField(max_length=150, blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    max_capacity = models.PositiveIntegerField(null=True, blank=True)

    # Lifecycle: status governs active/inactive/archived while the row still
    # exists; is_deleted/deleted_at is a separate recycle-bin flag (same
    # two-axis pattern as Gallery - see Gallery model below).
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.ministry_name

class Notification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class DeviceToken(models.Model):
    """Web push subscription storage.

    Despite the old name, this model is used to store the browser push subscription.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # The push subscription endpoint (unique-ish per browser/service worker)
    endpoint = models.URLField(max_length=500, unique=True, blank=True, default='')


    # VAPID keys provided by the browser
    p256dh = models.CharField(max_length=500, blank=True, default='')
    auth = models.CharField(max_length=500, blank=True, default='')


    platform = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{getattr(self.user, 'email', '')} - {self.platform}" 




class MemberProfile(models.Model):
    ROLE_CHOICES = [
        ('Visitor', 'Visitor'),
        ('Member', 'Member'),
        ('Ministry Leader', 'Ministry Leader'),
        ('Pastor', 'Pastor'),
        ('Administrator', 'Administrator'),
    ]

    STATUS_CHOICES = [
        ('PENDING_APPROVAL', 'PENDING_APPROVAL'),
        ('ACTIVE', 'ACTIVE'),
        ('REJECTED', 'REJECTED'),
        ('SUSPENDED', 'SUSPENDED'),
        ('DISABLED', 'DISABLED'),
        ('LOCKED', 'LOCKED'),
    ]

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    MARITAL_STATUS_CHOICES = [
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Divorced', 'Divorced'),
        ('Widowed', 'Widowed'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)

    # Public role assignment is controlled at registration time; admins cannot be self-registered.
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='Visitor')

    # Approval workflow gates authentication/authorization.
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING_APPROVAL')

    # Historical verification flags - email verification is no longer a
    # required step, but the fields remain for any existing records/badges.
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    profile_image = models.URLField(blank=True, null=True)

    # Uploaded profile picture (registration form file upload). profile_image
    # above remains for URL-based photos (e.g. Google login avatar).
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True, validators=[validate_image_upload_size])

    # --- Member registration fields ---
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    national_id = models.CharField(max_length=50, blank=True, default='')
    occupation = models.CharField(max_length=150, blank=True, default='')
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, default='')
    residential_address = models.TextField(blank=True, default='')
    county = models.CharField(max_length=100, blank=True, default='')
    town_city = models.CharField(max_length=100, blank=True, default='')
    emergency_contact_name = models.CharField(max_length=150, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')
    baptized = models.BooleanField(default=False)
    confirmed = models.BooleanField(default=False)
    church_branch = models.CharField(max_length=150, blank=True, default='')
    agreed_to_policies = models.BooleanField(default=False)

    # Assigned once approved (Church Admin action generates this).
    member_number = models.CharField(max_length=30, blank=True, default='', unique=False)

    # --- Visitor registration fields ---
    age = models.PositiveIntegerField(null=True, blank=True)
    visitor_address = models.TextField(blank=True, default='')
    purpose_of_visit = models.CharField(max_length=255, blank=True, default='')
    service_attended = models.CharField(max_length=150, blank=True, default='')
    date_of_visit = models.DateField(null=True, blank=True)
    prayer_request = models.TextField(blank=True, default='')

    # --- Login security ---
    failed_login_attempts = models.PositiveIntegerField(default=0)
    remember_me_requested = models.BooleanField(default=False)

    # Any access token issued before this moment is rejected (see
    # ApprovedJWTAuthentication) - set on every password change (self
    # service, admin-initiated reset, and forgot-password), so a stolen
    # token stops working the instant the password is changed instead of
    # remaining valid for the rest of its 7-day lifetime regardless.
    tokens_invalid_before = models.DateTimeField(null=True, blank=True)

    # --- Visitor -> Member self-service upgrade request ---
    MEMBERSHIP_UPGRADE_STATUS_CHOICES = [
        ('NONE', 'NONE'),
        ('PENDING', 'PENDING'),
        ('REJECTED', 'REJECTED'),
    ]
    membership_upgrade_status = models.CharField(
        max_length=10, choices=MEMBERSHIP_UPGRADE_STATUS_CHOICES, default='NONE',
    )
    membership_upgrade_requested_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} profile"


def invalidate_existing_tokens(user):
    """Call after any password change (self-service, admin-initiated
    reset, or forgot-password) - every access token issued before this
    moment stops working on its very next use (see
    ApprovedJWTAuthentication), regardless of how much of its 7-day
    lifetime remains. No-op for accounts without a MemberProfile (e.g. a
    superuser created via createsuperuser)."""
    from django.utils import timezone
    profile = getattr(user, 'profile', None)
    if profile is not None:
        profile.tokens_invalid_before = timezone.now()
        profile.save(update_fields=['tokens_invalid_before'])


class ContactMessage(models.Model):
    """Public contact messages from visitors/members."""

    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()

    # Admin reply (stored on the same record)
    reply_text = models.TextField(blank=True, default='')
    replied_at = models.DateTimeField(null=True, blank=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='If the user is signed in, link the message to their account.',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ContactMessage: {self.subject}"


class MemberHomecell(models.Model):
    """Exactly one homecell per member (user). `homecell` is a Ministry row
    tagged category='homecell' - see Ministry.category."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='homecell_enrollment',
    )
    homecell = models.ForeignKey(Ministry, on_delete=models.PROTECT, limit_choices_to={'category': 'homecell'})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.homecell.ministry_name}"


class MemberMinistry(models.Model):
    """Member can enroll for multiple ministries/departments. Joining is
    subject to approval - a new row starts PENDING until the ministry's
    Church Admin/Leader/Assistant Leader decides it (see
    MinistryJoinRequestDecisionView); leaving remains instant self-service
    regardless of status."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ministry_enrollments',
    )
    ministry = models.ForeignKey('api.Ministry', on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'ministry'], name='unique_user_ministry'),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.ministry.ministry_name}"


# Staffing policy target for every Ministry/Home Cell Fellowship (and the
# Media Team) - shown as guidance on admin list/detail/dashboard pages; a
# department below this count is flagged "understaffed", never blocked.
MIN_REQUIRED_ADMINS = 4

# Hard cap enforced at assignment time (see DepartmentAdminAssignmentCreateView/
# DepartmentAdminCreateAccountView) - a 5th admin is rejected outright. Equal
# to MIN_REQUIRED_ADMINS today, making 4 an exact target, not just a floor;
# kept as a separate constant since the two could diverge later.
MAX_DEPARTMENT_ADMINS = 4


class DepartmentAdminAssignment(models.Model):
    """Maps a Department Administrator (admin_user) to a department (ministry) and records which Church Admin assigned it."""

    ROLE_CHOICES = [
        ('leader', 'Leader'),
        ('assistant_leader', 'Assistant Leader'),
    ]

    department = models.ForeignKey('api.Ministry', on_delete=models.CASCADE, related_name='admin_assignments')
    admin_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='department_admin_assignments')

    # Display/reporting only - both roles grant identical permissions via
    # is_department_admin_for(). Mainly meaningful for Home Cell Fellowships,
    # which distinguish a Leader from an Assistant Leader.
    assignment_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='leader')

    # What this specific admin is responsible for within the department/
    # homecell - free text, display/reporting only (not permission-bearing).
    duties = models.TextField(blank=True, default='')

    # Who assigned this administrator.
    church_admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='department_admin_assignments_assigned',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['department', 'admin_user'], name='unique_department_admin_assignment'),
        ]

    def __str__(self):
        return f"{self.admin_user_id} -> {self.department_id}"


class Gallery(models.Model):
    """A named collection of photos/videos (an event album, a department's
    gallery, a conference/crusade/seminar/camp, etc.) - unlimited, created
    by a Church Administrator or the Super Administrator. Individual media
    lives in GalleryItem; this is just the container + its organization
    (category, department, date, visibility, active/archived)."""

    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('members', 'Members Only'),
        ('admins', 'Administrators Only'),
    ]

    # Draft: only visible to whoever can manage this gallery. Published:
    # visible per `visibility` above. Archived: hidden from everyone except
    # managers, but distinct from Draft (was public once, retired now).
    # Orthogonal to is_deleted (the recycle bin) below.
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    category = models.ForeignKey('GalleryCategory', on_delete=models.PROTECT, related_name='galleries')

    # A department gallery links to the existing Ministry model (category
    # can independently still be e.g. 'conference' for a department's
    # conference album). Optional - not every gallery belongs to one.
    department = models.ForeignKey('Ministry', null=True, blank=True, on_delete=models.SET_NULL, related_name='galleries')

    event_name = models.CharField(max_length=200, blank=True, default='')
    event_theme = models.CharField(max_length=200, blank=True, default='')
    event_location = models.CharField(max_length=200, blank=True, default='')

    # The date of the event/period this gallery documents (not upload date)
    # - lets galleries be organized/filtered by year and month even when
    # uploaded well after the fact.
    event_date = models.DateField(null=True, blank=True)

    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)

    # Shown in the homepage Gallery section - at most one gallery should be
    # featured at a time (enforced in the view, not the DB).
    is_featured = models.BooleanField(default=False)

    cover_image = models.ImageField(upload_to='galleries/covers/', null=True, blank=True, validators=[validate_image_upload_size])

    # Recycle bin: soft-deleted galleries are hidden from every normal
    # queryset but recoverable until permanently deleted.
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_galleries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-event_date', '-created_at']
        verbose_name_plural = 'Galleries'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.cover_image and not self.cover_image._committed:
            compressed = compress_image(self.cover_image)
            if compressed:
                self.cover_image = compressed
        super().save(*args, **kwargs)


class Album(models.Model):
    """An optional sub-collection inside a Gallery (e.g. a "Youth Camp
    2026" gallery split into "Day 1" / "Day 2" / "Group Photos" albums).
    GalleryItems may belong directly to a Gallery without an Album."""

    STATUS_CHOICES = Gallery.STATUS_CHOICES

    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='albums')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    cover_image = models.ImageField(upload_to='galleries/albums/covers/', null=True, blank=True, validators=[validate_image_upload_size])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_albums')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.gallery.title} - {self.name}'

    def save(self, *args, **kwargs):
        if self.cover_image and not self.cover_image._committed:
            compressed = compress_image(self.cover_image)
            if compressed:
                self.cover_image = compressed
        super().save(*args, **kwargs)


class GalleryCategory(models.Model):
    """Admin-managed gallery category (Sunday Services, Crusades, Youth
    Ministry, ...) - unlimited, not a fixed enum."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Gallery categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class GalleryItem(models.Model):
    """One photo or video inside a Gallery (and optionally an Album within
    it). Photos are uploaded files; videos are external links (YouTube/
    Vimeo/Facebook), same pattern as the existing Sermon.video_url - this
    app doesn't host video files."""

    ITEM_TYPE_CHOICES = [
        ('photo', 'Photo'),
        ('video', 'Video'),
    ]

    STATUS_CHOICES = Gallery.STATUS_CHOICES

    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name='items')
    album = models.ForeignKey(Album, null=True, blank=True, on_delete=models.SET_NULL, related_name='items')
    item_type = models.CharField(max_length=10, choices=ITEM_TYPE_CHOICES, default='photo')

    title = models.CharField(max_length=200, blank=True, default='')
    image = models.ImageField(upload_to='galleries/items/', null=True, blank=True, validators=[validate_image_upload_size])
    video_url = models.URLField(blank=True, default='')
    # Custom video thumbnail - photos use `image` itself as their thumbnail.
    thumbnail = models.ImageField(upload_to='galleries/items/thumbnails/', null=True, blank=True, validators=[validate_image_upload_size])

    caption = models.CharField(max_length=255, blank=True, default='')
    tags = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='published')

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='uploaded_gallery_items')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.caption or f'{self.item_type} #{self.id}'

    def save(self, *args, **kwargs):
        if self.thumbnail and not self.thumbnail._committed:
            compressed = compress_image(self.thumbnail)
            if compressed:
                self.thumbnail = compressed
        if self.item_type == 'photo' and self.image and not self.image._committed:
            compressed = compress_image(self.image)
            if compressed:
                self.image = compressed
        super().save(*args, **kwargs)


class MediaTeamMember(models.Model):
    """Grants a user gallery-management permission (create/upload/edit/
    archive/delete galleries and their items) without making them a full
    Church Administrator - appointed by a Church Admin/Super Admin, same
    pattern as DepartmentAdminAssignment. The user's normal role
    (Member, Ministry Leader, etc.) is unchanged; this is purely an
    additional grant checked alongside is_church_admin().

    `status` gates a member-initiated join request (PENDING until a Church
    Admin decides); an admin adding someone directly is pre-approved, hence
    the default. `is_active`/`role` support the Media Team Dashboard's
    activate/suspend and per-member role assignment (Camera Operator,
    Photographer, etc. - free text so Church Admins can add custom roles
    without a migration, per spec)."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='media_team_membership')
    role = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='APPROVED')
    is_active = models.BooleanField(default=True)
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='media_team_additions')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} (Media Team)'

