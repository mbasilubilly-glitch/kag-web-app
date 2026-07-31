from django.db import models
from django.conf import settings

# Note: This is a lightweight audit mechanism.
# If you prefer a fully migrated database-backed model,
# create and run a Django migration for RoleAuditLog.


class RoleAuditLog(models.Model):
    """Audit trail for role assignments.

    Records who changed a member's role, from what value to what value,
    and why (optional reason).
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='role_audit_actor',
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='role_audit_target',
    )

    old_role = models.CharField(max_length=30, blank=True, default='')
    new_role = models.CharField(max_length=30, blank=True, default='')

    reason = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RoleAudit actor={self.actor_id} target={self.target_user_id} {self.old_role}->{self.new_role}"

