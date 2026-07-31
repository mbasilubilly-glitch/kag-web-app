"""Centralized role/permission checks.

These used to be scattered across views.py, views_role.py,
admin_provisioning.py, and views_department_admin_assignments.py, each with
its own near-duplicate is_church_admin()/is_super_admin(). See
PWA/ARCHITECTURE.md for the role model this implements (Church Admin vs.
Department Admin vs. the one true Super Administrator).
"""

from rest_framework import permissions

from .models import MediaTeamMember, DepartmentAdminAssignment


def is_church_admin(user):
    """Church Admin = Django is_staff/is_superuser OR MemberProfile.role in
    (Administrator, Pastor). Also passes for Department Admins, since the
    role model conflates the two - see is_church_admin_account below."""
    if not user or not user.is_authenticated:
        return False

    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return True

    try:
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', None)
        return role in ('Administrator', 'Pastor')
    except Exception:
        return False


# Some call sites historically imported this same check as `is_super_admin`
# (from views_role.py). Kept as an alias so those call sites don't change
# behavior. Not to be confused with is_true_super_admin below, which is a
# stricter, different concept (the one literal Super Administrator).
is_super_admin = is_church_admin


class IsChurchAdmin(permissions.BasePermission):
    """Like DRF's IsAdminUser, but also passes for role-based Church
    Admins (MemberProfile.role in Administrator/Pastor) who don't hold
    Django's is_staff flag - not just literal Django staff/superusers."""

    def has_permission(self, request, view):
        return is_church_admin(request.user)


def is_media_team(user):
    if not user or not user.is_authenticated:
        return False
    return MediaTeamMember.objects.filter(user=user, status='APPROVED', is_active=True).exists()


class IsChurchAdminOrMediaTeam(permissions.BasePermission):
    """Church Admin/Super Admin, or a user specifically appointed to the
    Media Team - used only for gallery management, nowhere else."""

    def has_permission(self, request, view):
        return is_church_admin(request.user) or is_media_team(request.user)


def is_true_super_admin(user):
    """The one true Super Administrator: Django is_staff AND is_superuser.

    Distinct from `is_church_admin()`, which also passes for
    role='Administrator'/'Pastor' users (Church Admins). Per spec, only the
    true Super Administrator may create, suspend, reactivate, delete, or
    reset the password of a Church Administrator.
    """
    return bool(user and user.is_authenticated and user.is_staff and user.is_superuser)


def is_church_admin_account(user):
    """True if `user` is a Church Administrator account that only the
    Super Administrator should be able to suspend/delete/reset/re-role.

    The role model conflates Church Admin and Department Admin (both use
    role='Administrator'/'Pastor' - see ROLES_AND_FEATURES.md section 0),
    so a holder of any DepartmentAdminAssignment is treated as a
    Department Admin instead, manageable by any Church Admin per spec.
    """
    if not user:
        return False
    if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return False
    profile = getattr(user, 'profile', None)
    if getattr(profile, 'role', None) not in ('Administrator', 'Pastor'):
        return False

    return not DepartmentAdminAssignment.objects.filter(admin_user=user).exists()


def requires_super_admin_to_manage(user):
    """True if only the true Super Administrator may suspend, reactivate,
    delete, reset the password of, or re-role `user`. Covers both a Church
    Administrator account (see is_church_admin_account) and the Super
    Administrator account itself - the latter must never be modifiable by
    a mere Church Admin, even though is_church_admin_account() excludes it
    (it isn't a "Church Admin account" - it's the one account that
    outranks every Church Admin)."""
    return bool(is_true_super_admin(user) or is_church_admin_account(user))


def is_department_admin_for(user, ministry_id):
    """True if the user can administer the given ministry/department: either
    a church admin (who can administer any department) or someone holding a
    DepartmentAdminAssignment for this specific ministry."""
    if is_church_admin(user):
        return True
    if not user or not user.is_authenticated:
        return False
    return DepartmentAdminAssignment.objects.filter(admin_user=user, department_id=ministry_id).exists()


class IsEventAdminOrReadOnly(permissions.BasePermission):
    """Only a church admin, or the Department Admin for the event's ministry,
    may edit/delete an event. The Media Team may also edit/delete
    church-wide (non-department) events - same flat, not department-scoped,
    access they already have for sermons/galleries/the livestream."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.ministry_id is not None:
            return is_department_admin_for(request.user, obj.ministry_id)
        return is_church_admin(request.user) or is_media_team(request.user)


class IsOnlineMeetingAdminOrReadOnly(permissions.BasePermission):
    """Same rule as IsEventAdminOrReadOnly: only a church admin or the
    Department Admin for the session's ministry may edit/delete/cancel it.
    Church-wide (ministry=None) sessions are church-admin-only."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.ministry_id is not None:
            return is_department_admin_for(request.user, obj.ministry_id)
        return is_church_admin(request.user)
