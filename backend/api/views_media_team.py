from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MediaTeamMember, Ministry
from .serializers import MediaTeamMemberSerializer
from .permissions import is_church_admin, is_department_admin_for


def _media_team_ministry():
    return Ministry.objects.filter(category='ministry', is_deleted=False, ministry_name='Media Team').first()


def is_media_team_admin(user):
    """Church Admin/Super Admin, or the specific person assigned as the
    Media Team's own Leader/Assistant Leader (via DepartmentAdminAssignment
    against the seeded 'Media Team' ministry - the same mechanism every
    other department uses) - same access model as Ministry/Home Cell
    consoles, just for the Media Team's roster/dashboard instead."""
    if is_church_admin(user):
        return True
    ministry = _media_team_ministry()
    return bool(ministry and is_department_admin_for(user, ministry.id))


class IsMediaTeamAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_media_team_admin(request.user)


class MediaTeamListCreateView(generics.ListCreateAPIView):
    """Church Admin / Super Admin, or the Media Team's own assigned Leader/
    Assistant Leader: appoint or list Media Team members (users granted
    gallery-management access without being full Church Admins). Directly-
    added members are pre-approved (status='APPROVED', the model default) -
    the join-request queue below is for member-initiated requests instead."""

    serializer_class = MediaTeamMemberSerializer
    permission_classes = [IsMediaTeamAdmin]

    def get_queryset(self):
        # Pending join requests live in their own queue (see
        # MediaTeamJoinRequestsListView below) - this is the roster of
        # current (and formerly rejected) members only.
        return (
            MediaTeamMember.objects.exclude(status='PENDING')
            .select_related('user', 'user__profile', 'added_by')
            .order_by('-created_at')
        )

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('user')
        user = User.objects.filter(pk=user_id).first()
        if not user:
            raise ValidationError({'user': 'Select a valid user.'})
        if MediaTeamMember.objects.filter(user=user).exists():
            raise ValidationError({'user': 'This user is already on the Media Team.'})

        member = MediaTeamMember.objects.create(user=user, role=request.data.get('role', ''), added_by=request.user)
        return Response(MediaTeamMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class MediaTeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Church Admin / Super Admin, or the Media Team's own assigned Leader/
    Assistant Leader: view/update (role, active/suspended) or remove a
    Media Team member."""

    queryset = MediaTeamMember.objects.select_related('user', 'user__profile', 'added_by')
    serializer_class = MediaTeamMemberSerializer
    permission_classes = [IsMediaTeamAdmin]


class MyMediaTeamMembershipView(APIView):
    """Any signed-in member: check their own Media Team status (or lack
    thereof), so the join UI knows whether to show Join/Pending/Member/
    Rejected."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        membership = MediaTeamMember.objects.filter(user=request.user).first()
        if not membership:
            return Response(None)
        return Response(MediaTeamMemberSerializer(membership).data)


class MediaTeamJoinRequestView(APIView):
    """Any signed-in member: submit (or resubmit, if previously rejected) a
    request to join the Media Team."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        existing = MediaTeamMember.objects.filter(user=request.user).first()
        if existing:
            if existing.status == 'APPROVED':
                return Response({'detail': 'You are already on the Media Team.'}, status=status.HTTP_400_BAD_REQUEST)
            existing.status = 'PENDING'
            existing.save(update_fields=['status'])
            return Response(MediaTeamMemberSerializer(existing).data)

        member = MediaTeamMember.objects.create(user=request.user, status='PENDING')
        return Response(MediaTeamMemberSerializer(member).data, status=status.HTTP_201_CREATED)


class MediaTeamJoinRequestsListView(generics.ListAPIView):
    """Church Admin / Super Admin, or the Media Team's own assigned Leader/
    Assistant Leader: pending Media Team join requests."""

    serializer_class = MediaTeamMemberSerializer
    permission_classes = [IsMediaTeamAdmin]

    def get_queryset(self):
        return (
            MediaTeamMember.objects.filter(status='PENDING')
            .select_related('user', 'user__profile')
            .order_by('created_at')
        )


class MediaTeamJoinRequestDecisionView(APIView):
    """Church Admin / Super Admin, or the Media Team's own assigned Leader/
    Assistant Leader: approve or reject a pending Media Team join request.
    Body: {"status": "APPROVED"|"REJECTED"}."""

    permission_classes = [IsMediaTeamAdmin]

    def post(self, request, pk):
        new_status = request.data.get('status')
        if new_status not in ('APPROVED', 'REJECTED'):
            return Response({'detail': 'status must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        join_request = MediaTeamMember.objects.filter(pk=pk, status='PENDING').first()
        if not join_request:
            return Response({'detail': 'Pending join request not found.'}, status=status.HTTP_404_NOT_FOUND)

        join_request.status = new_status
        join_request.save(update_fields=['status'])
        return Response(MediaTeamMemberSerializer(join_request).data)
