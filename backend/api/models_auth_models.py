from django.conf import settings
from django.db import models


class PasswordResetOTP(models.Model):
    """DB-backed OTP for password reset."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_otps",
    )
    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=50, default="password_reset")

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    attempts = models.PositiveIntegerField(default=0)
    max_attempts = models.PositiveIntegerField(default=5)

    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"PasswordResetOTP(email={self.email}, used={self.is_used})"


class BlacklistedAccessToken(models.Model):
    """Access-token JTIs invalidated before their natural expiry (currently
    only via explicit sign-out). Access tokens are otherwise stateless and
    valid for their full lifetime regardless of client-side state - without
    this, "Sign Out" only clears the browser's copy, and the token itself
    stays fully usable server-side for up to 7 more days if anyone else
    ever obtained it. `expires_at` mirrors the token's own `exp` claim
    purely so old rows are safe to prune later; it plays no role in
    whether the token is rejected - being listed here at all is enough."""

    jti = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blacklisted_access_tokens",
    )
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    def __str__(self):
        return f"BlacklistedAccessToken(user={self.user_id}, jti={self.jti})"

