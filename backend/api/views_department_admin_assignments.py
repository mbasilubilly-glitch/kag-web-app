from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .admin_provisioning import create_provisioned_admin_account
from .models import MemberProfile, Ministry, DepartmentAdminAssignment, MAX_DEPARTMENT_ADMINS
from .permissions import is_church_admin, is_department_admin_for
from .role_audit import RoleAuditLog
from .serializers_department_admin_assignments import (
    DepartmentAdminAssignmentSerializer,
    DepartmentAdminAssignmentCreateSerializer,
    MyDepartmentAdminAssignmentSerializer,
)


class MyDepartmentAdminAssignmentsView(generics.ListAPIView):
    """Lets a Department Administrator discover which department(s) they administer."""

    serializer_class = MyDepartmentAdminAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            DepartmentAdminAssignment.objects.filter(admin_user=self.request.user)
            .select_related('department')
            .order_by('department__ministry_name')
        )


class DepartmentAdminAssignmentListByDepartmentView(generics.ListAPIView):
    serializer_class = DepartmentAdminAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        dept_id = self.kwargs.get('department_id')

        # Only Church Admins can view assignments.
        if not is_church_admin(self.request.user):
            raise PermissionDenied('Admin access required')

        # Any Church Admin can view all assignments for a department, not
        # just the ones they personally created - church_admin_user is
        # audit metadata (who assigned it), not an access-scoping field.
        return (
            DepartmentAdminAssignment.objects.filter(
                department_id=dept_id,
            )
            .select_related('department', 'admin_user', 'church_admin_user')
            .order_by('-created_at')
        )


class DepartmentAdminAssignmentCreateView(generics.GenericAPIView):
    serializer_class = DepartmentAdminAssignmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')

        serializer = DepartmentAdminAssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        department_id = serializer.validated_data['department_id']
        admin_user_id = serializer.validated_data['admin_user_id']
        assignment_role = serializer.validated_data.get('assignment_role', 'leader')
        duties = serializer.validated_data.get('duties', '')

        department = Ministry.objects.filter(id=department_id).first()
        if not department:
            raise ValidationError({'department_id': 'Department not found.'})

        admin_user = User.objects.filter(id=admin_user_id).first()
        if not admin_user:
            raise ValidationError({'admin_user_id': 'Admin user not found.'})

        already_assigned = DepartmentAdminAssignment.objects.filter(department=department, admin_user=admin_user).exists()
        current_admin_count = DepartmentAdminAssignment.objects.filter(department=department).count()
        if not already_assigned and current_admin_count >= MAX_DEPARTMENT_ADMINS:
            raise ValidationError({
                'detail': f'{department.ministry_name} already has the maximum of {MAX_DEPARTMENT_ADMINS} admins assigned. Remove one before assigning another.',
            })

        # Promote an existing Member/Visitor to Department Administrator as
        # part of this assignment. This is scoped to a real department
        # assignment (not a bare role escalation), so any Church Admin may
        # do it - unlike a direct PATCH /users/:id/role/ to Administrator,
        # which is Super-Admin-only to prevent self-escalation.
        profile, _ = MemberProfile.objects.get_or_create(user=admin_user)
        if profile.role not in ('Administrator', 'Pastor'):
            old_role = profile.role
            profile.role = 'Administrator'
            if profile.status == 'PENDING_APPROVAL':
                profile.status = 'ACTIVE'
            profile.save(update_fields=['role', 'status'])
            RoleAuditLog.objects.create(
                actor=request.user,
                target_user=admin_user,
                old_role=old_role,
                new_role='Administrator',
                reason=f'Promoted to Department Administrator for department #{department_id}',
            )

        assignment, created = DepartmentAdminAssignment.objects.get_or_create(
            department=department,
            admin_user=admin_user,
            church_admin_user=request.user,
            defaults={'assignment_role': assignment_role, 'duties': duties},
        )

        # If the same department+admin exists but was assigned by a different church admin,
        # enforce uniqueness at DB level won't match because church_admin_user differs; handle explicitly.
        if not created:
            # Still ensure assignment is scoped to current church admin, and
            # let re-assignment update the leader/assistant-leader role/duties.
            assignment.church_admin_user = request.user
            assignment.assignment_role = assignment_role
            assignment.duties = duties
            assignment.save(update_fields=['church_admin_user', 'assignment_role', 'duties'])

        return Response(
            {'detail': 'Department admin assigned successfully.', 'assignment': DepartmentAdminAssignmentSerializer(assignment).data},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class DepartmentAdminAssignmentDeleteView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')

        assignment_id = self.kwargs.get('assignment_id')

        # Any Church Admin may remove any department's assignment - see the
        # matching note in DepartmentAdminAssignmentListByDepartmentView.
        assignment = DepartmentAdminAssignment.objects.filter(id=assignment_id).first()
        if not assignment:
            raise ValidationError({'detail': 'Assignment not found.'})

        assignment.delete()
        return Response({'detail': 'Department admin assignment removed.'}, status=status.HTTP_200_OK)


class DepartmentAdminCreateAccountView(generics.GenericAPIView):
    """Church Admin: create a brand-new user account and assign it to a
    department in one step, distinct from assigning an existing user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')

        department_id = request.data.get('department_id')
        if not department_id:
            raise ValidationError({'department_id': 'department_id is required.'})

        department = Ministry.objects.filter(id=department_id).first()
        if not department:
            raise ValidationError({'department_id': 'Department not found.'})

        current_admin_count = DepartmentAdminAssignment.objects.filter(department=department).count()
        if current_admin_count >= MAX_DEPARTMENT_ADMINS:
            raise ValidationError({
                'detail': f'{department.ministry_name} already has the maximum of {MAX_DEPARTMENT_ADMINS} admins assigned. Remove one before assigning another.',
            })

        user, _temp_password = create_provisioned_admin_account(
            username=request.data.get('username'),
            email=request.data.get('email'),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            phone=request.data.get('phone', ''),
            role='Administrator',
            actor=request.user,
            audit_reason=f'Created as Department Administrator for {department.ministry_name}',
        )

        assignment_role = request.data.get('assignment_role') or 'leader'
        if assignment_role not in dict(DepartmentAdminAssignment.ROLE_CHOICES):
            assignment_role = 'leader'

        assignment = DepartmentAdminAssignment.objects.create(
            department=department,
            admin_user=user,
            church_admin_user=request.user,
            assignment_role=assignment_role,
            duties=request.data.get('duties', ''),
        )

        return Response(
            {
                'detail': 'Department Administrator account created and assigned. A temporary password has been emailed to the user.',
                'assignment': DepartmentAdminAssignmentSerializer(assignment).data,
            },
            status=status.HTTP_201_CREATED,
        )

