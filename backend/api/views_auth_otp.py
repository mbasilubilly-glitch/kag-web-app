import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import invalidate_existing_tokens
from .models_auth_models import PasswordResetOTP
from .auth_serializers import (
    EmailSerializer,
    PasswordResetConfirmSerializer,
)


OTP_TTL_SECONDS = 10 * 60  # 10 minutes
MAX_VERIFY_ATTEMPTS = 5


def _now():
    return timezone.now()


def _is_otp_expired(expires_at):
    return expires_at is None or expires_at <= _now()


def _generate_otp_code():
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_otp_email(email, subject, purpose_label, otp_code):
    send_mail(
        subject=subject,
        message=(
            f"Your {purpose_label} code is {otp_code}. "
            f"It expires in {OTP_TTL_SECONDS // 60} minutes."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


class PasswordResetSendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            # Don't reveal whether the account exists.
            return Response({"detail": "If your account exists, reset instructions have been sent."}, status=status.HTTP_200_OK)

        otp_code = _generate_otp_code()
        expires_at = _now() + timedelta(seconds=OTP_TTL_SECONDS)

        PasswordResetOTP.objects.update_or_create(
            user=user,
            email=email,
            purpose="password_reset",
            defaults={
                "otp_code": otp_code,
                "expires_at": expires_at,
                "attempts": 0,
                "max_attempts": MAX_VERIFY_ATTEMPTS,
                "is_used": False,
            },
        )

        _send_otp_email(email, "Reset your password", "password reset", otp_code)

        return Response({"detail": "If your account exists, reset instructions have been sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        otp_code = serializer.validated_data["otp"].strip()
        new_password = serializer.validated_data["new_password"]

        record = PasswordResetOTP.objects.select_for_update().filter(
            email__iexact=email,
            purpose="password_reset",
            is_used=False,
        ).order_by("created_at").first()

        if not record:
            return Response({"detail": "No active password reset OTP for this email."}, status=status.HTTP_400_BAD_REQUEST)

        if record.attempts >= record.max_attempts:
            return Response({"detail": "OTP attempts exceeded."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if _is_otp_expired(record.expires_at):
            return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        if record.otp_code != otp_code:
            record.attempts += 1
            record.save(update_fields=["attempts"])
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        invalidate_existing_tokens(user)

        record.is_used = True
        record.save(update_fields=["is_used"])

        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)

