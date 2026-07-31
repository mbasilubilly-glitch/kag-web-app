from django.db.models import ProtectedError, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ministry
from .serializers_homecells_admin import HomecellAdminSerializer
from .permissions import IsChurchAdmin


class HomecellAdminListCreateView(generics.ListCreateAPIView):
    """Church Admin / Super Admin: list and create Home Cell Fellowships
    (unlimited). List excludes soft-deleted rows; supports ?search= (name/
    area/county) and ?status= (active/inactive/archived) filters."""

    serializer_class = HomecellAdminSerializer
    permission_classes = [IsChurchAdmin]

    def get_queryset(self):
        qs = Ministry.objects.filter(category='homecell', is_deleted=False).order_by('ministry_name')

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(ministry_name__icontains=search)
                | Q(area_location__icontains=search)
                | Q(county__icontains=search)
            )

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    def perform_create(self, serializer):
        serializer.save(category='homecell')


class HomecellAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve/update a Home Cell Fellowship; DELETE is a soft delete
    (recycle bin), not a hard delete."""

    serializer_class = HomecellAdminSerializer
    permission_classes = [IsChurchAdmin]
    queryset = Ministry.objects.filter(category='homecell', is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])


class HomecellArchiveView(APIView):
    """Archive or restore a Home Cell Fellowship without deleting it.
    Body: {"action": "archive"|"restore"} (default action is archive)."""

    permission_classes = [IsChurchAdmin]

    def post(self, request, pk):
        homecell = Ministry.objects.filter(pk=pk, category='homecell', is_deleted=False).first()
        if not homecell:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        homecell.status = 'active' if request.data.get('action') == 'restore' else 'archived'
        homecell.save(update_fields=['status'])
        return Response(HomecellAdminSerializer(homecell).data)


class HomecellRecycleBinView(APIView):
    """Church Admin / Super Admin: list every soft-deleted Home Cell
    Fellowship."""

    permission_classes = [IsChurchAdmin]

    def get(self, request):
        deleted = Ministry.objects.filter(category='homecell', is_deleted=True).order_by('-deleted_at')
        return Response({'homecells': HomecellAdminSerializer(deleted, many=True).data})


class HomecellRestoreView(APIView):
    """Body: {"id": <homecell id>}."""

    permission_classes = [IsChurchAdmin]

    def post(self, request):
        homecell = Ministry.objects.filter(pk=request.data.get('id'), category='homecell', is_deleted=True).first()
        if not homecell:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        homecell.is_deleted = False
        homecell.deleted_at = None
        homecell.save(update_fields=['is_deleted', 'deleted_at'])
        return Response({'detail': 'Restored.'})


class HomecellPermanentDeleteView(APIView):
    """Body: {"id": <homecell id>}."""

    permission_classes = [IsChurchAdmin]

    def post(self, request):
        homecell = Ministry.objects.filter(pk=request.data.get('id'), category='homecell', is_deleted=True).first()
        if not homecell:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            homecell.delete()
        except ProtectedError:
            return Response(
                {'detail': 'This Home Cell still has members enrolled. Transfer or remove them before permanently deleting it.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({'detail': 'Permanently deleted.'})
