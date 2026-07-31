from django.contrib.auth.models import User
from rest_framework import serializers


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value: str):
        # Minimal validation; expand later to match your password strength rules.
        if not value or len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Self-service password change for an already-authenticated user (e.g.
    a Church Administrator who signed in with a Super-Admin-set or emailed
    temporary password and now wants to set their own)."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value: str):
        if not value or len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        return value


