from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import GalleryCategory
from .serializers import GalleryCategorySerializer
from .views_gallery import CanManageGalleries


class GalleryCategoryListCreateView(generics.ListCreateAPIView):
    """Any signed-in user can list categories (needed to populate the
    gallery creation form's dropdown); only someone who can manage
    galleries (Church Admin/Super Admin/Media Team/Department Admin) can
    create one."""

    serializer_class = GalleryCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = GalleryCategory.objects.all()
        if self.request.query_params.get('active_only') == 'true':
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [CanManageGalleries()]
        return super().get_permissions()


class GalleryCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Edit, activate/deactivate, or remove a category. Deletion is
    blocked (PROTECT) if any Gallery still references it - deactivate
    instead for categories with history."""

    queryset = GalleryCategory.objects.all()
    serializer_class = GalleryCategorySerializer
    permission_classes = [CanManageGalleries]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.galleries.exists():
            return Response(
                {'detail': 'This category has galleries and cannot be deleted. Deactivate it instead.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
