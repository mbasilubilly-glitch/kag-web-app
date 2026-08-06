from datetime import datetime, timezone as dt_timezone

from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models_auth_models import BlacklistedAccessToken


STATUS_MESSAGES = {
    'PENDING_APPROVAL': 'Your account is still awaiting approval from a church administrator.',
    'REJECTED': 'Your registration was not approved. Contact the church office for details.',
    'SUSPENDED': 'Your account has been suspended. Contact a church administrator.',
    'DISABLED': 'Your account has been disabled. Contact a church administrator.',
    'LOCKED': 'Your account is locked. Contact a church administrator to unlock it.',
}


class TokenObtainPairWithApprovalSerializer(TokenObtainPairSerializer):
    """Issue JWT only if the user's MemberProfile is ACTIVE.

    Failed sign-in attempts are intentionally not tracked or auto-locked -
    per product decision, users get unlimited login attempts. The per-IP
    ScopedRateThrottle on the view (see below) is the only anti-brute-force
    measure; LOCKED remains a valid status (settable by an admin/support
    action) that still blocks sign-in if ever set directly.
    """

    def validate(self, attrs):
        login_input = attrs.get(self.username_field)
        candidate = User.objects.filter(**{self.username_field: login_input}).select_related('profile').first()

        # The sign-in form advertises "Email / Member ID / Username", but
        # Django's ModelBackend only ever matches the literal username -
        # without this, anyone who types their email (a completely
        # reasonable reading of that label) gets a guaranteed 401 no
        # matter how correct their password is. Email is enforced unique
        # at registration (see serializers_registration.py), so this is
        # safe to resolve to a single account.
        if candidate is None and login_input:
            candidate = User.objects.filter(email=login_input).select_related('profile').first()
            if candidate is not None:
                attrs[self.username_field] = candidate.username

        if candidate is not None:
            profile = getattr(candidate, 'profile', None)
            if profile is not None and profile.status == 'LOCKED':
                raise PermissionDenied(STATUS_MESSAGES['LOCKED'])

        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        # Validate profile status before issuing token.
        profile = getattr(user, 'profile', None)
        status_value = getattr(profile, 'status', None)

        if status_value != 'ACTIVE':
            raise PermissionDenied(STATUS_MESSAGES.get(status_value, 'Your account is not active yet.'))

        return super().get_token(user)



class TokenObtainPairWithApprovalView(TokenObtainPairView):
    serializer_class = TokenObtainPairWithApprovalSerializer
    # Per-IP rate limit, on top of the per-account lockout above - the
    # lockout alone doesn't stop credential stuffing spread across many
    # different usernames from a single source.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except PermissionDenied as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)


class LogoutView(generics.GenericAPIView):
    """Actually invalidates the access token presented, not just a
    client-side convenience - without this, "Sign Out" only cleared the
    browser's copy while the token itself stayed fully valid server-side
    for the rest of its lifetime for anyone else who had it."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        token = request.auth
        if token is not None:
            BlacklistedAccessToken.objects.get_or_create(
                jti=token['jti'],
                defaults={
                    'user': request.user,
                    'expires_at': datetime.fromtimestamp(token['exp'], tz=dt_timezone.utc),
                },
            )
        return Response({'detail': 'Signed out.'})





