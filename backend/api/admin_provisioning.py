import secrets

from django.conf import settings as django_settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from rest_framework.exceptions import ValidationError

from .models import MemberProfile
from .role_audit import RoleAuditLog


def create_provisioned_admin_account(*, username, email, first_name, last_name, phone, role, actor, audit_reason, password=None):
    """Create a brand-new User + MemberProfile for an admin-created account
    (Church Administrator or Department Administrator), with an audit trail
    entry. If `password` is given, the creating Super Admin has chosen it
    themselves; otherwise a temporary one is generated - either way it's
    emailed to the new user, who can change it later from their own Profile
    page once signed in.
    """
    username = (username or '').strip()
    email = (email or '').strip()

    if not username or not email:
        raise ValidationError({'detail': 'username and email are required.'})
    if User.objects.filter(username=username).exists():
        raise ValidationError({'username': 'That username is already taken.'})
    if User.objects.filter(email=email).exists():
        raise ValidationError({'email': 'That email is already registered.'})

    password = (password or '').strip()
    if password and len(password) < 8:
        raise ValidationError({'password': 'Password must be at least 8 characters.'})
    temp_password = password or secrets.token_urlsafe(9)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=temp_password,
        first_name=first_name or '',
        last_name=last_name or '',
    )

    MemberProfile.objects.update_or_create(
        user=user,
        defaults={
            'role': role,
            'status': 'ACTIVE',
            'email_verified': True,
            'phone_verified': bool(phone),
            'phone': phone or '',
        },
    )

    RoleAuditLog.objects.create(
        actor=actor,
        target_user=user,
        old_role='',
        new_role=role,
        reason=audit_reason,
    )

    send_mail(
        subject='Your Church Management System account has been created',
        message=(
            'An administrator created an account for you.\n'
            f'Username: {username}\n'
            f'Temporary password: {temp_password}\n\n'
            'Please sign in and change your password as soon as possible.'
        ),
        from_email=django_settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    return user, temp_password
