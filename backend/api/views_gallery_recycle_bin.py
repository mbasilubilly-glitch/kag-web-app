from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Gallery, Album, GalleryItem
from .serializers import GallerySerializer, AlbumSerializer, GalleryItemSerializer
from .permissions import is_church_admin, is_media_team
from .views_gallery import manageable_department_ids, can_manage_gallery_object


def _deleted_galleries_queryset(user):
    if is_church_admin(user) or is_media_team(user):
        return Gallery.objects.filter(is_deleted=True)
    dept_ids = manageable_department_ids(user)
    return Gallery.objects.filter(is_deleted=True, department_id__in=dept_ids)


class GalleryRecycleBinView(APIView):
    """Church Admin / Super Admin / Media Team see every soft-deleted
    gallery, album, and item; a Department Admin sees only their own
    department's."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        deleted_galleries = _deleted_galleries_queryset(request.user)
        deleted_gallery_ids = list(deleted_galleries.values_list('id', flat=True))

        # Albums/items whose parent gallery isn't itself deleted, but which
        # were individually removed, still need the same department scoping
        # - reuse the manageable galleries to scope them.
        if is_church_admin(request.user) or is_media_team(request.user):
            albums = Album.objects.filter(is_deleted=True)
            items = GalleryItem.objects.filter(is_deleted=True)
        else:
            dept_ids = manageable_department_ids(request.user)
            albums = Album.objects.filter(is_deleted=True, gallery__department_id__in=dept_ids)
            items = GalleryItem.objects.filter(is_deleted=True, gallery__department_id__in=dept_ids)

        return Response({
            'galleries': GallerySerializer(deleted_galleries, many=True).data,
            'albums': AlbumSerializer(albums, many=True).data,
            'items': GalleryItemSerializer(items, many=True).data,
        })


def _resolve(kind, obj_id):
    model = {'gallery': Gallery, 'album': Album, 'item': GalleryItem}.get(kind)
    if not model:
        raise ValidationError({'type': "Must be 'gallery', 'album', or 'item'."})
    obj = model.objects.filter(pk=obj_id, is_deleted=True).first()
    if not obj:
        return None
    return obj


def _gallery_of(obj):
    if isinstance(obj, Gallery):
        return obj
    return obj.gallery


class GalleryRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        kind = request.data.get('type')
        obj = _resolve(kind, request.data.get('id'))
        if not obj:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, _gallery_of(obj)):
            raise PermissionDenied('You do not have permission to restore this item.')

        obj.is_deleted = False
        obj.deleted_at = None
        obj.save(update_fields=['is_deleted', 'deleted_at'])
        return Response({'detail': 'Restored.'})


class GalleryPermanentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        kind = request.data.get('type')
        obj = _resolve(kind, request.data.get('id'))
        if not obj:
            return Response({'detail': 'Not found in recycle bin.'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, _gallery_of(obj)):
            raise PermissionDenied('You do not have permission to delete this item.')

        # Remove the underlying file(s) from storage, not just the row.
        for field_name in ('image', 'thumbnail', 'cover_image'):
            field = getattr(obj, field_name, None)
            if field:
                field.delete(save=False)

        obj.delete()
        return Response({'detail': 'Permanently deleted.'})
