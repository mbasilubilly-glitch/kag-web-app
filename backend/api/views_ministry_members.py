from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MemberHomecell, MemberMinistry, Ministry
from .permissions import is_department_admin_for, is_true_super_admin


class MinistryMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.profile.phone', read_only=True, default='')
    role = serializers.CharField(source='user.profile.role', read_only=True, default='')

    class Meta:
        model = MemberMinistry
        fields = ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'created_at']


class HomecellMemberSerializer(serializers.ModelSerializer):
    """Same shape as MinistryMemberSerializer, sourced from MemberHomecell
    instead of MemberMinistry - see MinistryMembersListView below."""

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.profile.phone', read_only=True, default='')
    role = serializers.CharField(source='user.profile.role', read_only=True, default='')

    class Meta:
        model = MemberHomecell
        fields = ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'created_at']


class MinistryMembersListView(generics.ListAPIView):
    """Roster of members enrolled in a ministry/department, OR a Home Cell
    Fellowship (homecells are Ministry rows tagged category='homecell' -
    member enrollment for those lives in MemberHomecell, not MemberMinistry,
    so this branches on category to return the right roster either way) -
    visible to church admins and to Department/Home Cell Administrators
    assigned to it."""

    permission_classes = [permissions.IsAuthenticated]

    def _is_homecell(self):
        return Ministry.objects.filter(pk=self.kwargs.get('ministry_id'), category='homecell').exists()

    def get_serializer_class(self):
        return HomecellMemberSerializer if self._is_homecell() else MinistryMemberSerializer

    def get_queryset(self):
        ministry_id = self.kwargs.get('ministry_id')
        if not is_department_admin_for(self.request.user, ministry_id):
            raise PermissionDenied('You do not administer this department.')

        if self._is_homecell():
            return (
                MemberHomecell.objects.filter(homecell_id=ministry_id)
                .select_related('user', 'user__profile')
                .order_by('user__first_name', 'user__last_name')
            )
        # Ministry membership is subject to approval - the roster is
        # approved members only; pending requests are a separate view below.
        return (
            MemberMinistry.objects.filter(ministry_id=ministry_id, status='APPROVED')
            .select_related('user', 'user__profile')
            .order_by('user__first_name', 'user__last_name')
        )


class MinistryJoinRequestsListView(generics.ListAPIView):
    """Pending join requests for a ministry - visible to Church Admins and
    to the ministry's own Leader/Assistant Leader (same gating as the
    approved roster above)."""

    serializer_class = MinistryMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ministry_id = self.kwargs.get('ministry_id')
        if not is_department_admin_for(self.request.user, ministry_id):
            raise PermissionDenied('You do not administer this department.')
        return (
            MemberMinistry.objects.filter(ministry_id=ministry_id, status='PENDING')
            .select_related('user', 'user__profile')
            .order_by('created_at')
        )


class MinistryJoinRequestDecisionView(APIView):
    """Approve or reject a pending ministry join request.
    Body: {"status": "APPROVED"|"REJECTED"}."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ministry_id, request_id):
        if not is_department_admin_for(request.user, ministry_id):
            raise PermissionDenied('You do not administer this department.')

        new_status = request.data.get('status')
        if new_status not in ('APPROVED', 'REJECTED'):
            return Response({'detail': 'status must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        join_request = MemberMinistry.objects.filter(pk=request_id, ministry_id=ministry_id, status='PENDING').first()
        if not join_request:
            return Response({'detail': 'Pending join request not found.'}, status=status.HTTP_404_NOT_FOUND)

        join_request.status = new_status
        join_request.save(update_fields=['status'])
        return Response(MinistryMemberSerializer(join_request).data)


class MinistrySearchableUserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', read_only=True, default='')
    already_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone', 'already_enrolled']

    def get_already_enrolled(self, obj):
        enrolled_ids = self.context.get('enrolled_ids', set())
        return obj.id in enrolled_ids


class MinistryMemberSearchView(generics.ListAPIView):
    """Lets a Department Admin (who does NOT have UserListView's
    church-admin-only access to the full member directory) search the
    church membership to find someone to add to their own ministry -
    scoped narrowly to this one purpose, not a general user search."""

    serializer_class = MinistrySearchableUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ministry_id = self.kwargs.get('ministry_id')
        if not is_department_admin_for(self.request.user, ministry_id):
            raise PermissionDenied('You do not administer this department.')

        query = self.request.query_params.get('q', '').strip()
        if not query:
            return User.objects.none()

        qs = User.objects.select_related('profile').filter(
            Q(username__icontains=query)
            | Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
        )
        if not is_true_super_admin(self.request.user):
            qs = qs.exclude(is_staff=True, is_superuser=True)
        return qs.order_by('first_name', 'last_name')[:20]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ministry_id = self.kwargs.get('ministry_id')
        is_homecell = Ministry.objects.filter(pk=ministry_id, category='homecell').exists()
        if is_homecell:
            enrolled_ids = MemberHomecell.objects.filter(homecell_id=ministry_id).values_list('user_id', flat=True)
        else:
            enrolled_ids = MemberMinistry.objects.filter(ministry_id=ministry_id, status='APPROVED').values_list('user_id', flat=True)
        ctx['enrolled_ids'] = set(enrolled_ids)
        return ctx


class MinistryMemberEditSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)


class MinistryMemberAddView(APIView):
    """Church Admin or the ministry's own Leader/Assistant Leader: register
    a member directly, bypassing the request queue (an admin adding someone
    proactively counts as pre-approved). Body: {"user_id": <id>}."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ministry_id):
        if not is_department_admin_for(request.user, ministry_id):
            raise PermissionDenied('You do not administer this ministry.')

        ministry = Ministry.objects.filter(pk=ministry_id, category='ministry').first()
        if not ministry:
            return Response({'detail': 'Ministry not found.'}, status=status.HTTP_404_NOT_FOUND)

        member = User.objects.filter(pk=request.data.get('user_id')).first()
        if not member:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        MemberMinistry.objects.update_or_create(
            user=member, ministry=ministry, defaults={'status': 'APPROVED'},
        )
        return Response({'detail': f'{member.username} registered to {ministry.ministry_name}.'})


class MinistryMemberRemoveView(APIView):
    """Church Admin or the ministry's own Leader/Assistant Leader: edit a
    member's basic contact details, or remove them (or a rejected/pending
    request), scoped to this specific ministry. Editing is deliberately
    limited to name/phone - email and role changes stay Church-Admin-only
    via the general Membership List, since those affect login/permissions
    well beyond this one department."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_enrollment(self, ministry_id, user_id):
        enrollment = MemberMinistry.objects.select_related('user', 'user__profile').filter(
            user_id=user_id, ministry_id=ministry_id,
        ).first()
        if not enrollment:
            return None
        return enrollment

    def patch(self, request, ministry_id, user_id):
        if not is_department_admin_for(request.user, ministry_id):
            raise PermissionDenied('You do not administer this ministry.')

        enrollment = self._get_enrollment(ministry_id, user_id)
        if not enrollment:
            return Response({'detail': 'This member is not enrolled in this ministry.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MinistryMemberEditSerializer(data=request.data, partial=True)
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

        return Response(MinistryMemberSerializer(enrollment).data)

    def delete(self, request, ministry_id, user_id):
        if not is_department_admin_for(request.user, ministry_id):
            raise PermissionDenied('You do not administer this ministry.')

        enrollment = self._get_enrollment(ministry_id, user_id)
        if not enrollment:
            return Response({'detail': 'This member is not enrolled in this ministry.'}, status=status.HTTP_404_NOT_FOUND)

        enrollment.delete()
        return Response({'detail': 'Removed.'})
