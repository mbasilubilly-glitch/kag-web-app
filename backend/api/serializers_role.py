from rest_framework import serializers


class RolePatchSerializer(serializers.Serializer):
    """Payload for role patch."""

    role = serializers.CharField(max_length=30)

    def validate_role(self, value):
        # Keep this validation in sync with MemberProfile.ROLE_CHOICES
        from .models import MemberProfile

        allowed = {c[0] for c in getattr(MemberProfile, 'ROLE_CHOICES', [])}
        if allowed and value not in allowed:
            raise serializers.ValidationError('Invalid role.')
        return value

