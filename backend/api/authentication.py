from datetime import datetime, timezone as dt_timezone

from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models_auth_models import BlacklistedAccessToken

# Statuses that must not be able to use an already-issued token. Token
# *issuance* is already gated to ACTIVE-only in two places (see
# TokenObtainPairWithApprovalSerializer.get_token in views_auth_approval.py,
# and views_auth_google.py's Google sign-in flow relies on this check too,
# since it issues a token via RefreshToken.for_user() without its own
# approval gate) - but neither of those re-runs once a token exists. Without
# this, suspending/rejecting/locking a member (or an admin later revoking a
# pending Google sign-in) only takes effect the next time they try to log
# in; their existing access/refresh tokens keep working for the rest of
# SIMPLE_JWT's 7/30 day lifetimes.
BLOCKED_STATUSES = {'REJECTED', 'SUSPENDED', 'DISABLED', 'LOCKED', 'PENDING_APPROVAL'}


class ApprovedJWTAuthentication(JWTAuthentication):
    """Same as JWTAuthentication, but also re-checks MemberProfile.status on
    every request - not just at token issuance - rejects a token whose jti
    was explicitly blacklisted at sign-out (see LogoutView), and rejects a
    token issued before the account's last password change (see
    MemberProfile.tokens_invalid_before) - a stolen token must not survive
    the very password change meant to lock the thief out."""

    def get_user(self, validated_token):
        jti = validated_token.get('jti')
        if jti and BlacklistedAccessToken.objects.filter(jti=jti).exists():
            raise AuthenticationFailed(
                'You have been signed out. Please sign in again.',
                code='token_blacklisted',
            )

        user = super().get_user(validated_token)
        profile = getattr(user, 'profile', None)
        if profile is not None and profile.status in BLOCKED_STATUSES:
            raise AuthenticationFailed(
                'Your account is no longer active. Please contact a church administrator.',
                code='account_not_active',
            )

        if profile is not None and profile.tokens_invalid_before is not None:
            issued_at = validated_token.get('iat')
            if issued_at is not None:
                issued_at_dt = datetime.fromtimestamp(issued_at, tz=dt_timezone.utc)
                if issued_at_dt < profile.tokens_invalid_before:
                    raise AuthenticationFailed(
                        'Your password was changed. Please sign in again.',
                        code='token_stale_password_change',
                    )

        return user
