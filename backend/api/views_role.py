from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .permissions import is_super_admin, is_true_super_admin, requires_super_admin_to_manage
from .models import MemberProfile
from .serializers_role import RolePatchSerializer


class UserRolePatchView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RolePatchSerializer

    def patch(self, request, pk, *args, **kwargs):
        if not is_super_admin(request.user):
            raise PermissionDenied('SUPER_ADMIN access required')

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = User.objects.filter(pk=int(pk)).first()
        if not target_user:
            raise ValidationError({'detail': 'User not found'})

        profile = MemberProfile.objects.get_or_create(user=target_user)[0]
        old_role = profile.role
        new_role = serializer.validated_data['role']

        # Only the true Super Administrator may promote someone to, or
        # modify, a Church Administrator role. Department Admin promotions
        # go through the department-assignment flow instead, which is
        # scoped to a specific department and open to any Church Admin.
        if new_role in ('Administrator', 'Pastor') and not is_true_super_admin(request.user):
            raise PermissionDenied(
                'Only the Super Administrator can assign an Administrator/Pastor role. '
                'To make someone a Department Administrator, assign them to a department instead.'
            )
        if requires_super_admin_to_manage(target_user) and not is_true_super_admin(request.user):
            raise PermissionDenied("Only the Super Administrator can change a Church Administrator's role.")

        # Approval step: approve pending user account.
        profile.status = 'ACTIVE'
        profile.email_verified = True
        profile.phone_verified = True

        # Apply requested role.
        profile.role = new_role
        profile.save(update_fields=['status', 'role', 'email_verified', 'phone_verified'])

        # Audit log.
        from .role_audit import RoleAuditLog
        RoleAuditLog.objects.create(
            actor=request.user,
            target_user=target_user,
            old_role=old_role or '',
            new_role=new_role or '',
            reason=request.data.get('reason') or 'Approval via SUPER_ADMIN role patch',
        )

        return Response(
            {
                'detail': 'Profile approved and role updated',
                'old_role': old_role,
                'new_role': new_role,
                'status': profile.status,
            },
            status=status.HTTP_200_OK,
        )

