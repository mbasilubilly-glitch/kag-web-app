from django.contrib.auth.models import User
from rest_framework import permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MemberHomecell, Ministry
from .permissions import is_department_admin_for


class HomecellMemberEditSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)


class HomecellMemberAddView(APIView):
    """Church Admin or the Home Cell's own Leader/Assistant Leader: register
    an existing member into this Home Cell Fellowship, or transfer them here
    from whichever cell they currently belong to (MemberHomecell is one row
    per user, so "add" and "transfer" are the same operation).
    Body: {"user_id": <id>}."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, homecell_id):
        if not is_department_admin_for(request.user, homecell_id):
            raise PermissionDenied('You do not administer this Home Cell Fellowship.')

        homecell = Ministry.objects.filter(pk=homecell_id, category='homecell').first()
        if not homecell:
            return Response({'detail': 'Home Cell Fellowship not found.'}, status=status.HTTP_404_NOT_FOUND)

        member = User.objects.filter(pk=request.data.get('user_id')).first()
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        MemberHomecell.objects.update_or_create(user=member, defaults={'homecell': homecell})
        return Response({'detail': f'{member.username} registered to {homecell.ministry_name}.'})


class HomecellMemberRemoveView(APIView):
    """Church Admin or the Home Cell's own Leader/Assistant Leader: remove a
    member from this specific Home Cell Fellowship (a no-op 404 if the
    member belongs to a different cell, so one Home Cell Admin can't remove
    another cell's member by guessing a user_id)."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_enrollment(self, homecell_id, user_id):
        return MemberHomecell.objects.select_related('user', 'user__profile').filter(
            user_id=user_id, homecell_id=homecell_id,
        ).first()

    def patch(self, request, homecell_id, user_id):
        if not is_department_admin_for(request.user, homecell_id):
            raise PermissionDenied('You do not administer this Home Cell Fellowship.')

        enrollment = self._get_enrollment(homecell_id, user_id)
        if not enrollment:
            return Response({'detail': 'This member is not enrolled in this Home Cell Fellowship.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HomecellMemberEditSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        member = enrollment.user
        user_fields = []
        if 'first_name' in data:
            member.first_name = data['first_name']
            user_fields.append('first_name')
        if 'last_name' in data:
            member.last_name = data['last_name']
            user_fields.append('last_name')
        if user_fields:
            member.save(update_fields=user_fields)

        if 'phone' in data and getattr(member, 'profile', None) is not None:
            member.profile.phone = data['phone']
            member.profile.save(update_fields=['phone'])

        return Response({'detail': 'Updated.'})

    def delete(self, request, homecell_id, user_id):
        if not is_department_admin_for(request.user, homecell_id):
            raise PermissionDenied('You do not administer this Home Cell Fellowship.')

        enrollment = self._get_enrollment(homecell_id, user_id)
        if not enrollment:
            return Response({'detail': 'This member is not enrolled in this Home Cell Fellowship.'}, status=status.HTTP_404_NOT_FOUND)

        enrollment.delete()
        return Response({'detail': 'Removed.'})
