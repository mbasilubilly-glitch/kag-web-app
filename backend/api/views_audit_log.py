from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import PermissionDenied

from .role_audit import RoleAuditLog
from .permissions import is_super_admin


def _display_name(user):
    if not user:
        return ''
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.username


class RoleAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    target_user_name = serializers.SerializerMethodField()

    class Meta:
        model = RoleAuditLog
        fields = ['id', 'actor', 'actor_name', 'target_user', 'target_user_name', 'old_role', 'new_role', 'reason', 'created_at']

    def get_actor_name(self, obj):
        return _display_name(obj.actor)

    def get_target_user_name(self, obj):
        return _display_name(obj.target_user)


class RoleAuditLogListView(generics.ListAPIView):
    """Super-admin-exclusive: view the full role-change audit trail."""

    serializer_class = RoleAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_super_admin(self.request.user):
            raise PermissionDenied('Super administrator access required.')
        return RoleAuditLog.objects.select_related('actor', 'target_user').order_by('-created_at')
