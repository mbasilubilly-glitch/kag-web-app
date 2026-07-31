from django.db.models import ProtectedError, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ministry
from .serializers_ministries_admin import MinistryAdminSerializer
from .permissions import IsChurchAdmin


class MinistryAdminListCreateView(generics.ListCreateAPIView):
    """Church Admin / Super Admin: list and create Ministries (unlimited).
    List excludes soft-deleted rows; supports ?search= (name/area/county)
    and ?status= (active/inactive/archived) filters."""

    serializer_class = MinistryAdminSerializer
    permission_classes = [IsChurchAdmin]

    def get_queryset(self):
        qs = Ministry.objects.filter(category='ministry', is_deleted=False).order_by('ministry_name')

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
        serializer.save(category='ministry')


class MinistryAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve/update a Ministry; DELETE is a soft delete (recycle bin),
    not a hard delete."""

    serializer_class = MinistryAdminSerializer
    permission_classes = [IsChurchAdmin]
    queryset = Ministry.objects.filter(category='ministry', is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])


class MinistryArchiveView(APIView):
    """Archive or restore a Ministry without deleting it.
    Body: {"action": "archive"|"restore"} (default action is archive)."""

    permission_classes = [IsChurchAdmin]

    def post(self, request, pk):
        ministry = Ministry.objects.filter(pk=pk, category='ministry', is_deleted=False).first()
        if not ministry:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        ministry.status = 'active' if request.data.get('action') == 'restore' else 'archived'
        ministry.save(update_fields=['status'])
        return Response(MinistryAdminSerializer(ministry).data)


class MinistryRecycleBinView(APIView):
    """Church Admin / Super Admin: list every soft-deleted Ministry."""

    permission_classes = [IsChurchAdmin]

    def get(self, request):
        deleted = Ministry.objects.filter(category='ministry', is_deleted=True).order_by('-deleted_at')
        return Response({'ministries': MinistryAdminSerializer(deleted, many=True).data})


class MinistryRestoreView(APIView):
    """Body: {"id": <ministry id>}."""

    permission_classes = [IsChurchAdmin]

    def post(self, request):
        ministry = Ministry.objects.filter(pk=request.data.get('id'), category='ministry', is_deleted=True).first()
        if not ministry:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        ministry.is_deleted = False
        ministry.deleted_at = None
        ministry.save(update_fields=['is_deleted', 'deleted_at'])
        return Response({'detail': 'Restored.'})


class MinistryPermanentDeleteView(APIView):
    """Body: {"id": <ministry id>}."""

    permission_classes = [IsChurchAdmin]

    def post(self, request):
        ministry = Ministry.objects.filter(pk=request.data.get('id'), category='ministry', is_deleted=True).first()
        if not ministry:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            ministry.delete()
        except ProtectedError:
            return Response(
                {'detail': 'This ministry still has members enrolled. Remove them before permanently deleting it.'},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({'detail': 'Permanently deleted.'})
