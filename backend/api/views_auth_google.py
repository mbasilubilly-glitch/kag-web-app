import logging

from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import MemberProfile
from .views_auth_approval import STATUS_MESSAGES

logger = logging.getLogger(__name__)


def _normalize_name(value: str) -> str:
    if not value:
        return ''
    return value.strip()


class GoogleAuthView(generics.GenericAPIView):
    """Login/create user via Google Identity Services.

    Expects:
      { "id_token": "..." }

    Returns SimpleJWT token pair compatible with the frontend:
      { "access": "...", "refresh": "..." }
    """

    permission_classes = [permissions.AllowAny]

    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        id_token = (request.data.get('id_token') or '').strip()
        if not id_token:
            return Response({'detail': 'id_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Token verification ---
        # For production, verify id_token signature/audience/issuer with Google.
        # This repo snapshot may not include server-side Google verification dependencies.
        # If you have google-auth-library installed, enable real verification.
        email = None
        given_name = ''
        family_name = ''
        picture = ''

        try:
            from google.oauth2 import id_token as google_id_token  # type: ignore
            from google.auth.transport import requests as google_requests  # type: ignore

            # Configure these in environment variables.
            # GOOGLE_OAUTH_CLIENT_ID is the OAuth 2.0 Client ID for your web app.
            import os

            client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
            if not client_id:
                return Response(
                    {'detail': 'GOOGLE_OAUTH_CLIENT_ID not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            request_adapter = google_requests.Request()
            decoded = google_id_token.verify_oauth2_token(id_token, request_adapter, client_id)

            email = decoded.get('email')
            given_name = _normalize_name(decoded.get('given_name') or '')
            family_name = _normalize_name(decoded.get('family_name') or '')
            picture = decoded.get('picture') or ''
        except Exception as e:
            # Production-safe: do not accept unverified tokens.
            logger.exception('Invalid Google id_token')
            return Response({'detail': f'Invalid id_token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


        if not email:
            return Response({'detail': 'Google id_token did not include an email.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- User lookup/create ---
        # Generate a deterministic username.
        username_base = (given_name + '.' + family_name).strip('.').lower() or email.split('@')[0]
        username = username_base.replace(' ', '.').replace('/', '.').replace('..', '.').strip('.')[:150]

        user = User.objects.filter(email__iexact=email).first()
        is_new_user = user is None
        if is_new_user:
            # Ensure username is unique
            candidate = username
            i = 1
            while User.objects.filter(username=candidate).exists():
                i += 1
                candidate = f"{username}.{i}"

            first_name = given_name
            last_name = family_name

            user = User.objects.create(
                username=candidate,
                email=email,
                first_name=first_name,
                last_name=last_name,
            )

        # Ensure MemberProfile exists with default Member role.
        profile, profile_created = MemberProfile.objects.get_or_create(user=user)
        is_new_signup = is_new_user or profile_created

        if is_new_signup:
            # Hard rule: Google sign-in must NOT grant admin, and a brand
            # new account always starts in the approval workflow, same as
            # every other public registration path. This must NOT re-apply
            # to a returning, already-approved user on every subsequent
            # sign-in - doing so previously reset every Google user back to
            # PENDING_APPROVAL (and stripped any admin/leader role) on each
            # login, locking them out until an admin re-approved them again.
            if profile.role not in ('Member', 'Visitor', 'Ministry Leader', 'Pastor', 'Administrator'):
                profile.role = 'Member'
            if profile.role in ('Administrator', 'Pastor'):
                profile.role = 'Member'
            profile.status = 'PENDING_APPROVAL'
            profile.phone_verified = False
            profile.email_verified = False

        if picture:
            profile.profile_image = picture

        profile.save()

        if profile.status != 'ACTIVE':
            return Response(
                {'detail': STATUS_MESSAGES.get(profile.status, 'Your account is not active yet.')},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)}, status=status.HTTP_200_OK)

