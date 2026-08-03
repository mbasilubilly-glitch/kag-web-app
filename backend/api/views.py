import os
import secrets
from datetime import date

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, views, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.throttling import ScopedRateThrottle

from .models import MemberProfile, Sermon, Event, EventRegistration, PrayerRequest, Ministry, Notification, DeviceToken, ContactMessage, LiveStream, validate_image_upload_size, invalidate_existing_tokens
from .models_department_attendance import DepartmentAttendanceRecord
from .pagination import StandardResultsSetPagination
from .views_system_analytics import _last_n_months
from .auth_serializers import ChangePasswordSerializer

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    SermonSerializer,
    EventSerializer,
    PrayerRequestSerializer,
    MinistrySerializer,
    NotificationSerializer,
    DeviceTokenSerializer,
    MemberProfileSerializer,
    EventRegistrationSerializer,
    ContactMessageSerializer,
    LiveStreamSerializer,
)

from .permissions import (
    is_church_admin,
    IsChurchAdmin,
    is_media_team,
    IsChurchAdminOrMediaTeam,
    is_true_super_admin,
    requires_super_admin_to_manage,
    is_department_admin_for,
    IsEventAdminOrReadOnly,
)


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfilePictureUploadView(views.APIView):
    """Upload/replace/remove the current user's own profile picture. Kept
    separate from ProfileView's JSON PATCH since DRF's nested writable
    serializers (UserSerializer -> profile) don't mix cleanly with
    multipart file uploads - this is a small, single-purpose endpoint
    instead."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, *args, **kwargs):
        picture = request.data.get('profile_picture')
        if not picture:
            raise ValidationError({'profile_picture': 'This field is required.'})

        # This view writes the file field directly (bypassing a serializer),
        # so the model field's own validators never run - check explicitly.
        try:
            validate_image_upload_size(picture)
        except DjangoValidationError as exc:
            raise ValidationError({'profile_picture': exc.messages})

        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        # Delete the previous file from disk before pointing at the new one
        # - reassigning a FileField doesn't do this on its own, so without
        # it every re-upload/edit left an orphaned file behind forever.
        if profile.profile_picture:
            profile.profile_picture.delete(save=False)
        profile.profile_picture = picture
        profile.save(update_fields=['profile_picture'])

        # ApprovedJWTAuthentication already read+cached request.user.profile
        # (a separate object instance from `profile` above) while
        # authenticating this same request - without overwriting that cache,
        # the serializer below would reflect the picture from before this
        # upload, not the one just saved.
        request.user.profile = profile
        return Response(UserSerializer(request.user).data)

    def delete(self, request, *args, **kwargs):
        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        if profile.profile_picture:
            profile.profile_picture.delete(save=False)
            profile.profile_picture = None
            profile.save(update_fields=['profile_picture'])

        request.user.profile = profile
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(views.APIView):
    """Self-service password change for the signed-in user - lets a Church
    Administrator (or anyone else) replace a Super-Admin-set or emailed
    temporary password with one of their own choosing once they have
    access to the account."""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['current_password']):
            raise ValidationError({'current_password': 'Current password is incorrect.'})

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        invalidate_existing_tokens(request.user)

        return Response({'detail': 'Password changed successfully.'}, status=200)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = User.objects.select_related(
            'profile', 'homecell_enrollment__homecell', 'media_team_membership'
        ).prefetch_related('ministry_enrollments__ministry').order_by('username')

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(profile__phone__icontains=search)
                | Q(profile__member_number__icontains=search)
            )

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(profile__status=status_param)

        role_param = self.request.query_params.get('role')
        if role_param:
            qs = qs.filter(profile__role=role_param)

        # The one true Super Administrator's account is invisible to
        # everyone else, including Church Admins - only the Super
        # Administrator can see it (and thus themselves) in this list.
        if not is_true_super_admin(self.request.user):
            qs = qs.exclude(is_staff=True, is_superuser=True)

        return qs

    def get_permissions(self):
        # DRF permissions system: enforce admin check in code for role-based access
        perms = super().get_permissions()
        return perms

    def get(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')
        return super().get(request, *args, **kwargs)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _block_if_hidden_super_admin(self, request):
        # The one true Super Administrator's profile is invisible to (and
        # unmodifiable by) everyone else, including Church Admins.
        target = self.get_object()
        if is_true_super_admin(target) and not is_true_super_admin(request.user):
            raise PermissionDenied('You do not have permission to access this profile.')

    def get(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')
        self._block_if_hidden_super_admin(request)
        return super().get(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')
        self._block_if_hidden_super_admin(request)
        return super().put(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')
        self._block_if_hidden_super_admin(request)
        return super().patch(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')
        target = self.get_object()
        if requires_super_admin_to_manage(target) and not is_true_super_admin(request.user):
            raise PermissionDenied('Only the Super Administrator can remove a Church Administrator account.')
        return super().delete(request, *args, **kwargs)

class SermonListCreateView(generics.ListCreateAPIView):
    queryset = Sermon.objects.order_by('-created_at')
    serializer_class = SermonSerializer
    # Public can read sermons; Church Admins and the Media Team can create.
    permission_classes = [IsChurchAdminOrMediaTeam | permissions.AllowAny]

    def get_permissions(self):
        # Allow list (GET) for everyone, but restrict create (POST) to admins/media team.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [IsChurchAdminOrMediaTeam()]

class SermonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sermon.objects.all()
    serializer_class = SermonSerializer

    # Public can read; Church Admins and the Media Team can update/delete.
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [IsChurchAdminOrMediaTeam()]


class LiveStreamView(generics.RetrieveUpdateAPIView):
    """Singleton (always the pk=1 row, created on first access) holding the
    church's permanent channel-live link. Public can read; Church Admins
    and the Media Team set/clear it. Past streams are a separate, manually
    curated archive (see SermonListCreateView, category='Live Recording'),
    not derived from this link's state."""

    serializer_class = LiveStreamSerializer

    def get_object(self):
        obj, _ = LiveStream.objects.get_or_create(pk=1)
        return obj

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [IsChurchAdminOrMediaTeam()]

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class LiveStreamGoLiveView(generics.GenericAPIView):
    """Church Admin/Media Team: flip the manual "is_live" flag on, driving
    the "LIVE NOW" badge on the public Live page. No external API - the
    admin is asserting they've actually started broadcasting from the link
    already saved in LiveStreamView."""

    serializer_class = LiveStreamSerializer
    permission_classes = [IsChurchAdminOrMediaTeam]

    def post(self, request, *args, **kwargs):
        stream, _ = LiveStream.objects.get_or_create(pk=1)
        stream.is_live = True
        stream.updated_by = request.user
        stream.save(update_fields=['is_live', 'updated_by'])
        return Response(LiveStreamSerializer(stream).data)


class LiveStreamEndView(generics.GenericAPIView):
    """Church Admin/Media Team: end the live stream and archive it to the
    Sermon Library (category='Live Recording') in one step, instead of
    separately flipping the flag off and filling in the "Add a Past
    Stream" form. video_url defaults to the currently saved live link -
    this only produces a working recording when that link is the specific
    broadcast's watch URL (YouTube/Facebook keep serving that same URL as
    the recording once the broadcast ends), not a channel's generic
    permanent /live link. Pass a different video_url in the request body
    to override it (e.g. when the saved link IS the permanent one)."""

    serializer_class = LiveStreamSerializer
    permission_classes = [IsChurchAdminOrMediaTeam]

    def post(self, request, *args, **kwargs):
        stream, _ = LiveStream.objects.get_or_create(pk=1)
        video_url = (request.data.get('video_url') or stream.url or '').strip()
        if not video_url:
            raise ValidationError({'video_url': 'No live link to archive - set one first or pass video_url.'})

        title = (request.data.get('title') or '').strip() \
            or f"Live Service - {timezone.now().strftime('%B %d, %Y')}"

        sermon = Sermon.objects.create(
            title=title,
            speaker='',
            category='Live Recording',
            video_url=video_url,
        )

        stream.is_live = False
        stream.updated_by = request.user
        stream.save(update_fields=['is_live', 'updated_by'])

        return Response(
            {
                'detail': 'Live stream ended and archived.',
                'sermon': SermonSerializer(sermon).data,
                'stream': LiveStreamSerializer(stream).data,
            },
            status=status.HTTP_201_CREATED,
        )


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer

    def get_queryset(self):
        qs = Event.objects.order_by('-date')
        ministry_id = self.request.query_params.get('ministry')
        if ministry_id is not None:
            qs = qs.filter(ministry_id=ministry_id)
        return qs

    def get_permissions(self):
        # Public can read events, but only admins/department admins can create/post events.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        ministry = serializer.validated_data.get('ministry')
        if ministry is not None:
            if not is_department_admin_for(self.request.user, ministry.id):
                raise PermissionDenied('You do not administer this department.')
        else:
            if not (is_church_admin(self.request.user) or is_media_team(self.request.user)):
                raise PermissionDenied('Only church administrators or the Media Team can create church-wide events.')
        serializer.save()


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsEventAdminOrReadOnly]

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    """Anyone (including an anonymous visitor - /prayer-request is a public,
    unauthenticated route) can submit a prayer request. Listing them back is
    a different matter entirely: these are personal, often sensitive
    submissions (health, family, financial struggles) meant for church
    leadership to pray over, not public record - only a Church Admin may
    list them. `IsAuthenticatedOrReadOnly` previously let literally anyone,
    logged in or not, read every member's prayer request via a plain GET."""

    queryset = PrayerRequest.objects.order_by('-created_at')
    serializer_class = PrayerRequestSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [IsChurchAdmin()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

class MinistryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Any signed-in member can view a ministry/homecell's info (needed for
    SingleMinistry.jsx and the member-facing homecell view); only a Church
    Admin can edit/delete here (the dedicated admin CRUD in
    views_ministries_admin.py/views_homecells_admin.py is the normal path
    for that)."""

    serializer_class = MinistrySerializer

    def get_queryset(self):
        # Members must not see (or resurrect via join) a recycle-binned
        # department; admin edit/delete of a soft-deleted row still goes
        # through the dedicated admin CRUD in views_ministries_admin.py, not
        # here.
        if self.request.method == 'GET':
            return Ministry.objects.filter(is_deleted=False)
        return Ministry.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsChurchAdmin()]

class NotificationListCreateView(generics.ListCreateAPIView):
    """Notifications are inherently a signed-in feature - there's no
    "your notifications" for a visitor who isn't signed in. Previously
    used IsAuthenticatedOrReadOnly, which let an anonymous GET through to
    get_queryset() below; since `Q(user=self.request.user)` isn't a valid
    comparison against Django's AnonymousUser, that crashed with an
    unhandled 500 (and would leak a full stack trace if DEBUG were ever
    accidentally left on) instead of a clean 401.

    POST (composing a notification, broadcast or targeted at a specific
    user) is Church Admin only - this was previously just IsAuthenticated
    with an unrestricted `user` field on the serializer, letting any
    signed-in Member/Visitor broadcast an arbitrary fake notification to
    every other signed-in user."""

    serializer_class = NotificationSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsChurchAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # Broadcast rows (user=None, e.g. admin-composed church-wide
        # announcements) are visible to every signed-in user; rows targeted
        # at a specific user (e.g. a membership upgrade request alert sent
        # to Church Admins) are visible only to that user - not the whole
        # authenticated user base.
        return Notification.objects.filter(
            Q(user=self.request.user) | Q(user__isnull=True)
        ).order_by('-created_at')

class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsChurchAdmin]

class PrayerRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PrayerRequest.objects.all()
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsChurchAdmin]

class DeviceTokenCreateView(generics.CreateAPIView):
    """Register a Web Push subscription from the frontend."""

    queryset = DeviceToken.objects.all()
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PushSubscriptionRegisterView(generics.CreateAPIView):
    """Upsert a Web Push subscription.

    Expects:
    {
      endpoint: 'https://...',
      keys: { p256dh: '...', auth: '...' }
    }
    """

    permission_classes = [IsAuthenticated]
    serializer_class = DeviceTokenSerializer

    def post(self, request, *args, **kwargs):
        endpoint = request.data.get('endpoint')
        keys = request.data.get('keys') or {}
        p256dh = keys.get('p256dh')
        auth_key = keys.get('auth')

        if not endpoint or not p256dh or not auth_key:
            return Response(
                {'detail': 'endpoint, keys.p256dh and keys.auth are required'},
                status=400,
            )

        # Upsert by endpoint
        obj, created = DeviceToken.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth_key,
                'platform': request.data.get('platform', '') or '',
            },
        )

        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=200 if not created else 201)


class DashboardSummaryView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'total_members': User.objects.count(),
            'total_sermons': Sermon.objects.count(),
            'total_events': Event.objects.count(),
        }
        if is_church_admin(request.user):
            data['pending_approvals'] = MemberProfile.objects.filter(status='PENDING_APPROVAL').count()
            data['membership_upgrade_requests'] = MemberProfile.objects.filter(membership_upgrade_status='PENDING').count()
        return Response(data)


class MyActivitySummaryView(views.APIView):
    """Personal activity view for Members and Visitors: their own
    attendance and event registrations over the last 6 months - the same
    shape as the Church Executive Dashboard's trend charts, but scoped to
    request.user instead of the whole church. Any signed-in user can see
    their own activity, regardless of role."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        months = _last_n_months(6)
        month_labels = [date(y, m, 1).strftime('%b %Y') for (y, m) in months]

        my_attendance = DepartmentAttendanceRecord.objects.filter(member=user, status='present')
        my_registrations = EventRegistration.objects.filter(user=user, status='Registered')

        attendance_trend = [
            {
                'label': label,
                'value': my_attendance.filter(session__session_date__year=y, session__session_date__month=m).count(),
            }
            for label, (y, m) in zip(month_labels, months)
        ]
        events_trend = [
            {
                'label': label,
                'value': my_registrations.filter(created_at__year=y, created_at__month=m).count(),
            }
            for label, (y, m) in zip(month_labels, months)
        ]

        return Response({
            'stats': {
                'attendance_count': my_attendance.count(),
                'events_registered': my_registrations.count(),
                'prayer_requests': PrayerRequest.objects.filter(user=user).count(),
            },
            'charts': {
                'attendance_trend': attendance_trend,
                'events_trend': events_trend,
            },
        })


class MemberProfileDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a MemberProfile by user id (admin only)."""
    serializer_class = MemberProfileSerializer
    permission_classes = [IsChurchAdmin]

    def get_object(self):
        user_pk = self.kwargs.get('pk')
        obj, created = MemberProfile.objects.get_or_create(user_id=user_pk)
        if is_true_super_admin(obj.user) and not is_true_super_admin(self.request.user):
            raise PermissionDenied('You do not have permission to access this profile.')
        return obj


class PendingProfilesListView(generics.ListAPIView):
    """List users whose profiles are pending approval (admin only)."""

    serializer_class = MemberProfileSerializer
    permission_classes = [IsChurchAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return MemberProfile.objects.filter(status='PENDING_APPROVAL').order_by('-created_at')


class MemberProfileApprovalView(generics.GenericAPIView):
    """Approve/reject a MemberProfile (admin only).

    Role assignment workflow (SUPER_ADMIN -> PATCH /api/users/:id/role):
      1) SUPER_ADMIN selects a member
      2) PATCH /api/users/:id/role
      3) backend verifies permission
      4) backend updates role
      5) backend records audit log

    Approval workflow here controls ACTIVE vs REJECTED, and doubles as the
    suspend/reactivate action for already-approved members: SUSPENDED blocks
    login (see TokenObtainPairWithApprovalSerializer), ACTIVE reactivates.
    """

    permission_classes = [IsChurchAdmin]

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        new_status = request.data.get('status')

        if not user_id or new_status not in ('ACTIVE', 'REJECTED', 'SUSPENDED'):
            return Response({'detail': 'user_id and status (ACTIVE|REJECTED|SUSPENDED) are required'}, status=400)

        try:
            profile = MemberProfile.objects.select_related('user').get(user_id=int(user_id))
        except MemberProfile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=404)

        if requires_super_admin_to_manage(profile.user) and not is_true_super_admin(request.user):
            raise PermissionDenied('Only the Super Administrator can suspend, reactivate, or reject a Church Administrator account.')

        profile.status = new_status

        # When rejected, consider them not verified.
        if new_status == 'REJECTED':
            profile.email_verified = False
            profile.phone_verified = False

        profile.save(update_fields=['status', 'email_verified', 'phone_verified'])

        return Response({'detail': f'Profile updated to {new_status}'}, status=200)


class AdminResetPasswordView(views.APIView):
    """Admin-initiated password reset: generates a temporary password and emails it to the user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Only church administrators can reset another user\'s password.')

        target = User.objects.filter(pk=kwargs.get('pk')).first()
        if not target:
            return Response({'detail': 'User not found'}, status=404)

        if requires_super_admin_to_manage(target) and not is_true_super_admin(request.user):
            raise PermissionDenied("Only the Super Administrator can reset a Church Administrator's password.")

        temp_password = secrets.token_urlsafe(9)
        target.set_password(temp_password)
        target.save(update_fields=['password'])
        invalidate_existing_tokens(target)

        if target.email:
            send_mail(
                subject='Your password has been reset',
                message=(
                    f'An administrator reset your password. Your temporary password is: {temp_password}\n'
                    'Please sign in and change it as soon as possible.'
                ),
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[target.email],
                fail_silently=False,
            )

        return Response({'detail': 'Password reset. The new password has been emailed to the user.'}, status=200)




class EventRegistrationListCreateView(generics.ListCreateAPIView):
    """Anyone can register for an event (POST), signed in or not -
    EventRegistration.jsx is a public walk-up form (name + phone only, no
    login); the frontend never lists this endpoint - listing every
    attendee's name/phone across every event is an admin (church office)
    concern, same as ContactMessageListCreateView's inbox, not something
    every member should be able to pull with a plain GET. Was previously
    IsAuthenticated with no per-user scoping, letting any Member/Visitor
    read every registration's name and phone number."""

    queryset = EventRegistration.objects.order_by('-created_at')
    serializer_class = EventRegistrationSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsChurchAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class EventRegistrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsChurchAdmin]


class ContactMessageListCreateView(generics.ListCreateAPIView):
    queryset = ContactMessage.objects.order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        # Public can create contact messages; only admins can view inbox.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsChurchAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # Link to authenticated user if present; otherwise allow anonymous.
        user = getattr(self.request, 'user', None)
        serializer.save(user=user if user and user.is_authenticated else None)


class ContactMessageDetailView(generics.RetrieveUpdateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    permission_classes = [IsChurchAdmin]

    def perform_update(self, serializer):
        reply_text = serializer.validated_data.get('reply_text')
        if reply_text:
            instance = serializer.save(replied_at=timezone.now())
            if instance.email:
                send_mail(
                    subject=f'Re: {instance.subject}',
                    message=(
                        f'Hi {instance.full_name},\n\n'
                        f'{reply_text}\n\n'
                        '— KAG Unity Church'
                    ),
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.email],
                    fail_silently=True,
                )
            # Also raise an in-app alert if they submitted this while
            # signed in - email alone is easy to miss, and this is exactly
            # the "admin replied to you" moment a notification is for.
            if instance.user_id:
                Notification.objects.create(
                    title=f'Reply to your message: {instance.subject}',
                    message=reply_text[:200] + ('…' if len(reply_text) > 200 else ''),
                    user=instance.user,
                )
        else:
            serializer.save()


class PushSendView(views.APIView):
    """Admin endpoint to send a Web Push notification to subscribed users."""

    permission_classes = [IsChurchAdmin]

    def post(self, request):
        title = request.data.get('title') or 'KAG Unity Church'
        body = request.data.get('body') or request.data.get('message') or ''
        url = request.data.get('url') or '/notifications'

        if not body:
            return Response({'detail': 'body (message) is required'}, status=400)

        try:
            from .push_service import send_push_to_all

            sent, failed = send_push_to_all(title=title, body=body, url=url)
        except RuntimeError:
            # get_vapid_private_key() raises this when push isn't configured
            # at all - a real setup problem, not a per-device delivery
            # failure (those are already handled per-token and never raise).
            return Response({'detail': 'Push notifications are not configured on this server.'}, status=503)

        return Response({'detail': f'Sent to {sent} of {sent + failed} device(s).', 'sent': sent, 'failed': failed})

        return Response({'detail': 'Push sent'})


