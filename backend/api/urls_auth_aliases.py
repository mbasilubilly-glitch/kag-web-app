"""Spec URL aliases.

Your system already implements the business logic under existing endpoints.
This module exposes *additional* URL paths so your API can match the spec
without duplicating logic.

Mapping (spec -> existing):
- POST /auth/login -> /api/auth/token
  (registration has no alias here - /auth/register/ in api/urls.py already
  matches the spec path directly)
- POST /auth/forgot-password -> /api/auth/password-reset/send
- POST /auth/reset-password -> /api/auth/password-reset/confirm
- GET  /users/pending -> /api/profiles/pending

Note: per-user approve/reject PATCH endpoints require wrapper views.
"""

from django.urls import path

from .views_auth_otp import (
    PasswordResetSendOTPView,
    PasswordResetConfirmOTPView,
)
from .views_auth_approval import TokenObtainPairWithApprovalView
from .views import PendingProfilesListView
from .views_role import UserRolePatchView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


# Wrapper endpoints to match spec approve/reject.
@api_view(['PATCH'])
def users_approve_reject_alias(request, pk: int):
    # Existing workflow: POST /profiles/approval/ with {user_id, status}
    # For per-user PATCH we translate here.
    action = request.path.split('/')[-1]
    if action == 'approve':
        new_status = 'ACTIVE'
    elif action == 'reject':
        new_status = 'REJECTED'
    else:
        return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    # Use the same admin gating as MemberProfileApprovalView (role-based
    # Church Admin, not just literal Django is_staff).
    # We call underlying logic directly by reusing its model updates.
    from .models import MemberProfile

    from rest_framework.exceptions import PermissionDenied
    from .permissions import is_church_admin

    if not is_church_admin(request.user):
        raise PermissionDenied('Admin access required')

    try:
        profile = MemberProfile.objects.get(user_id=int(pk))
    except MemberProfile.DoesNotExist:
        return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    profile.status = new_status
    if new_status == 'REJECTED':
        profile.email_verified = False
        profile.phone_verified = False
    profile.save(update_fields=['status', 'email_verified', 'phone_verified'])

    return Response({'detail': f'Profile updated to {new_status}'}, status=status.HTTP_200_OK)


urlpatterns = [
    # login + password reset aliases. NOTE: no 'auth/register/' alias here -
    # that path is already the real registration endpoint in api/urls.py
    # (RegisterView); aliasing it to the login view here would collide with
    # it and only "worked" before by accident of include() order.
    path('auth/login/', TokenObtainPairWithApprovalView.as_view(), name='spec_login_alias'),

    path('auth/forgot-password/', PasswordResetSendOTPView.as_view(), name='spec_forgot_password_alias'),
    path('auth/reset-password/', PasswordResetConfirmOTPView.as_view(), name='spec_reset_password_alias'),

    # approvals + role
    path('users/pending/', PendingProfilesListView.as_view(), name='spec_users_pending_alias'),
    path('users/<int:pk>/approve', users_approve_reject_alias, name='spec_users_approve_alias'),
    path('users/<int:pk>/reject', users_approve_reject_alias, name='spec_users_reject_alias'),

    # SUPER_ADMIN-only role management already exists; expose spec path.
    path('users/<int:pk>/role', UserRolePatchView.as_view(), name='spec_users_role_alias'),
]

