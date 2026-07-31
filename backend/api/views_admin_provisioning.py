from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .admin_provisioning import create_provisioned_admin_account
from .permissions import is_true_super_admin
from .serializers import UserSerializer


class ChurchAdminListCreateView(generics.ListAPIView):
    """Super Administrator only: list existing Church Administrator accounts,
    and create new ones. Per spec, only the Super Administrator is
    authorized to create a Church Administrator account, capped at
    MAX_CHURCH_ADMINS total."""

    MAX_CHURCH_ADMINS = 4

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_true_super_admin(self.request.user):
            raise PermissionDenied('Only the Super Administrator can manage Church Administrator accounts.')
        return User.objects.filter(
            profile__role__in=['Administrator', 'Pastor'],
            is_staff=False,
            is_superuser=False,
        ).order_by('username')

    def post(self, request, *args, **kwargs):
        if not is_true_super_admin(request.user):
            raise PermissionDenied('Only the Super Administrator can create Church Administrator accounts.')

        existing_count = User.objects.filter(
            profile__role__in=['Administrator', 'Pastor'],
            is_staff=False,
            is_superuser=False,
        ).count()
        if existing_count >= self.MAX_CHURCH_ADMINS:
            return Response(
                {'detail': f'Maximum of {self.MAX_CHURCH_ADMINS} Church Administrators reached. Delete an existing one before creating another.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        chosen_password = request.data.get('password')

        user, _temp_password = create_provisioned_admin_account(
            username=request.data.get('username'),
            email=request.data.get('email'),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            phone=request.data.get('phone', ''),
            role='Administrator',
            actor=request.user,
            audit_reason='Created as Church Administrator by Super Admin',
            password=chosen_password,
        )

        detail = (
            'Church Administrator created with the password you set. It has also been emailed to the user.'
            if chosen_password else
            'Church Administrator created. A temporary password has been emailed to the user.'
        )
        return Response(
            {
                'detail': detail,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
