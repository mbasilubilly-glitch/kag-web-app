from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import MemberHomecell, MemberMinistry, Ministry
from .serializers_homecells import HomecellSerializer
from .serializers import MinistrySerializer
from .views_homecells import seed_if_empty


class MemberMinistriesListView(generics.ListAPIView):
    """Return all ministries for the department selection UI."""

    serializer_class = MinistrySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        seed_if_empty()
        return Ministry.objects.filter(category='ministry', is_deleted=False).order_by('ministry_name')


class MemberDepartmentsSnapshotView(generics.GenericAPIView):
    """Convenience endpoint: returns homecell + selected ministries IDs + full ministries list."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        seed_if_empty()

        try:
            enrollment = MemberHomecell.objects.get(user=request.user)
        except MemberHomecell.DoesNotExist:
            enrollment = None

        selected = MemberMinistry.objects.filter(user=request.user).select_related('ministry')
        selected_ids = [str(m.ministry.id) for m in selected]
        selected_statuses = {str(m.ministry.id): m.status for m in selected}

        return Response(
            {
                'homecell': HomecellSerializer(enrollment.homecell).data if enrollment else None,
                'selected_ministry_ids': selected_ids,
                'selected_ministry_statuses': selected_statuses,
                'ministries': MinistrySerializer(Ministry.objects.filter(category='ministry', is_deleted=False).order_by('ministry_name'), many=True).data,
            }
        )

