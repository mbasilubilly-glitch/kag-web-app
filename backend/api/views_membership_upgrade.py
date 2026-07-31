from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MemberProfile, Notification
from .permissions import is_church_admin
from .role_audit import RoleAuditLog
from .serializers import UserSerializer


def _notify_church_admins(title, message):
    admins = User.objects.filter(
        Q(is_staff=True) | Q(is_superuser=True) | Q(profile__role__in=['Administrator', 'Pastor'])
    ).distinct()
    Notification.objects.bulk_create([
        Notification(user=admin, title=title, message=message) for admin in admins
    ])


class MembershipUpgradeRequestView(APIView):
    """A Visitor's self-service request to become a Member. Notifies every
    Church Admin so one of them can approve it (via the existing role-patch
    endpoint or the decision view below) - the account itself stays ACTIVE
    and able to sign in the whole time; only the role is pending change."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if profile is None or profile.role != 'Visitor':
            raise ValidationError({'detail': 'Only Visitor accounts can request to become a Member.'})
        if profile.membership_upgrade_status == 'PENDING':
            raise ValidationError({'detail': 'You already have a pending membership request.'})

        profile.membership_upgrade_status = 'PENDING'
        profile.membership_upgrade_requested_at = timezone.now()
        profile.save(update_fields=['membership_upgrade_status', 'membership_upgrade_requested_at'])

        name = request.user.get_full_name() or request.user.username
        _notify_church_admins(
            title='New membership request',
            message=f'{name} has requested to become a Member. Review it from Manage Users.',
        )

        return Response({'detail': 'Your request to become a Member has been sent to the church admins.'})


class MyMembershipUpgradeStatusView(APIView):
    """Lets the signed-in user check their own upgrade-request status, so
    the dashboard knows whether to show the request button, a pending
    notice, or nothing (already a Member or above)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        return Response({
            'role': getattr(profile, 'role', None),
            'membership_upgrade_status': getattr(profile, 'membership_upgrade_status', 'NONE'),
            'membership_upgrade_requested_at': getattr(profile, 'membership_upgrade_requested_at', None),
        })


class MembershipUpgradeRequestsListView(generics.ListAPIView):
    """Church Admin / Super Admin: list Visitors with a pending request to
    become a Member."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_church_admin(self.request.user):
            raise PermissionDenied('Admin access required')
        return User.objects.filter(profile__membership_upgrade_status='PENDING').select_related('profile')


class MembershipUpgradeDecisionView(APIView):
    """Church Admin / Super Admin: approve or reject a Visitor's pending
    membership request. Body: {"status": "APPROVED"|"REJECTED"}. Approving
    promotes the role to Member (same effect as the generic role-patch
    endpoint) and logs it to the audit trail; rejecting just clears the
    pending flag so the visitor can request again later."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')

        new_status = request.data.get('status')
        if new_status not in ('APPROVED', 'REJECTED'):
            return Response({'detail': 'status must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = MemberProfile.objects.select_related('user').filter(
            user_id=user_id, membership_upgrade_status='PENDING',
        ).first()
        if not profile:
            return Response({'detail': 'Pending membership request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if new_status == 'APPROVED':
            old_role = profile.role
            profile.role = 'Member'
            profile.membership_upgrade_status = 'NONE'
            profile.save(update_fields=['role', 'membership_upgrade_status'])
            RoleAuditLog.objects.create(
                actor=request.user,
                target_user=profile.user,
                old_role=old_role,
                new_role='Member',
                reason='Approved Visitor -> Member upgrade request',
            )
        else:
            profile.membership_upgrade_status = 'REJECTED'
            profile.save(update_fields=['membership_upgrade_status'])

        return Response({'detail': f'Membership request {new_status.lower()}.'})
