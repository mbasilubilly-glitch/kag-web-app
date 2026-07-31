from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Gallery, Album, GalleryItem, DepartmentAdminAssignment
from .serializers import (
    GallerySerializer, GalleryDetailSerializer, GalleryItemSerializer,
    AlbumSerializer, AlbumDetailSerializer,
)
from .permissions import IsChurchAdminOrMediaTeam, is_church_admin, is_media_team


def manageable_department_ids(user):
    """Department (Ministry) ids this user is a Department Administrator
    for - the basis of their scoped gallery access."""
    if not user or not user.is_authenticated:
        return []
    return list(DepartmentAdminAssignment.objects.filter(admin_user=user).values_list('department_id', flat=True))


def can_manage_galleries(user):
    """Broad 'can touch gallery management at all' check - full access for
    Church Admin/Super Admin/Media Team, scoped access for Department
    Admins (the specific department is checked separately per-object via
    can_manage_gallery_object)."""
    if not user or not user.is_authenticated:
        return False
    return is_church_admin(user) or is_media_team(user) or bool(manageable_department_ids(user))


def can_manage_gallery_object(user, gallery):
    if not user or not user.is_authenticated:
        return False
    if is_church_admin(user) or is_media_team(user):
        return True
    return gallery.department_id is not None and gallery.department_id in manageable_department_ids(user)


def _auto_publish_on_upload(item):
    """Uploading real content is a clear enough signal of intent to publish
    - a gallery (or the album an item was filed into) left sitting in
    'draft' after content was added is the #1 source of "I uploaded a
    photo but it's not showing up" reports. Only nudges 'draft' forward;
    an explicitly 'archived' gallery/album is left alone, and admins can
    still hit Unpublish afterwards if they genuinely want it hidden."""
    gallery = item.gallery
    if gallery.status == 'draft':
        gallery.status = 'published'
        gallery.published_at = timezone.now()
        gallery.save(update_fields=['status', 'published_at'])
    if item.album_id and item.album.status == 'draft':
        item.album.status = 'published'
        item.album.save(update_fields=['status'])


class CanManageGalleries(permissions.BasePermission):
    def has_permission(self, request, view):
        return can_manage_galleries(request.user)


def visible_galleries_queryset(user):
    """Visibility gating: 'public' galleries are visible to everyone
    (including anonymous visitors) once published, 'members' to any
    signed-in user once published, 'admins' only to a manager. Church
    Admin/Super Admin/Media Team see everything. A Department Admin sees
    everything in their own department (any status) PLUS the normal
    published view of everyone else's - they can manage their own
    department without being able to touch (or peek at drafts in) another
    department's. Soft-deleted galleries never appear here (recycle bin
    has its own endpoint)."""

    base = Gallery.objects.filter(is_deleted=False)

    if user and user.is_authenticated and (is_church_admin(user) or is_media_team(user)):
        return base

    dept_ids = manageable_department_ids(user) if user and user.is_authenticated else []
    own = Q(department_id__in=dept_ids) if dept_ids else Q(pk__in=[])

    if user and user.is_authenticated:
        general = Q(status='published', visibility__in=['public', 'members'])
    else:
        general = Q(status='published', visibility='public')

    return base.filter(own | general)


class GalleryListCreateView(generics.ListCreateAPIView):
    """List galleries (visibility-gated, searchable/filterable/sortable)
    and create new ones (Church Admin / Super Admin / Media Team / scoped
    Department Admin)."""

    serializer_class = GallerySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [CanManageGalleries()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = visible_galleries_queryset(self.request.user)

        params = self.request.query_params
        search = params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(event_name__icontains=search))

        category = params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        department = params.get('department')
        if department:
            qs = qs.filter(department_id=department)

        year = params.get('year')
        if year:
            qs = qs.filter(event_date__year=year)

        month = params.get('month')
        if month:
            qs = qs.filter(event_date__month=month)

        status_param = params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        featured_only = params.get('featured_only')
        if featured_only == 'true':
            qs = qs.filter(is_featured=True)

        sort = params.get('sort')
        sort_map = {
            'title': 'title',
            '-title': '-title',
            'date': 'created_at',
            '-date': '-created_at',
            'photos': 'item_count',
            '-photos': '-item_count',
        }
        if sort in ('photos', '-photos'):
            from django.db.models import Count
            qs = qs.annotate(item_count=Count('items'))
        if sort in sort_map:
            qs = qs.order_by(sort_map[sort])

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if is_church_admin(user) or is_media_team(user):
            serializer.save(created_by=user)
            return

        # Department Admin: force the gallery into one of their own
        # departments - never allow assigning someone else's.
        dept_ids = manageable_department_ids(user)
        requested_dept = serializer.validated_data.get('department')
        if requested_dept is not None and requested_dept.id not in dept_ids:
            raise PermissionDenied('You can only create galleries for your own department.')
        if requested_dept is None:
            from .models import Ministry
            requested_dept = Ministry.objects.filter(id=dept_ids[0]).first()
        serializer.save(created_by=user, department=requested_dept)


class GalleryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve a single gallery with its albums/items (visibility-gated);
    update is Church Admin / Super Admin / Media Team / scoped Department
    Admin; delete is a soft delete (recycle bin)."""

    serializer_class = GalleryDetailSerializer

    def get_queryset(self):
        return visible_galleries_queryset(self.request.user)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        obj = super().get_object()
        if self.request.method != 'GET' and not can_manage_gallery_object(self.request.user, obj):
            raise PermissionDenied('You do not have permission to manage this gallery.')
        return obj

    def get_serializer_context(self):
        context = super().get_serializer_context()
        gallery = self.get_queryset().filter(pk=self.kwargs.get('pk')).first()
        context['can_manage'] = bool(gallery and can_manage_gallery_object(self.request.user, gallery))
        return context

    def perform_update(self, serializer):
        gallery = self.get_object()
        was_published = gallery.status == 'published'
        instance = serializer.save()
        if instance.status == 'published' and not was_published:
            instance.published_at = timezone.now()
            instance.save(update_fields=['published_at'])

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])


class GalleryArchiveView(APIView):
    """Archive or restore a gallery without deleting it."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        gallery = Gallery.objects.filter(pk=pk, is_deleted=False).first()
        if not gallery:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, gallery):
            raise PermissionDenied('You do not have permission to manage this gallery.')
        gallery.status = 'archived' if request.data.get('action') != 'restore' else 'draft'
        gallery.save(update_fields=['status'])
        return Response(GallerySerializer(gallery).data)


class GalleryPublishView(APIView):
    """Publish or unpublish (revert to draft) a gallery."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        gallery = Gallery.objects.filter(pk=pk, is_deleted=False).first()
        if not gallery:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, gallery):
            raise PermissionDenied('You do not have permission to manage this gallery.')
        publish = request.data.get('action') != 'unpublish'
        gallery.status = 'published' if publish else 'draft'
        if publish and not gallery.published_at:
            gallery.published_at = timezone.now()
        gallery.save(update_fields=['status', 'published_at'])
        return Response(GallerySerializer(gallery).data)


class GalleryFeatureView(APIView):
    """Church Admin / Super Admin / Media Team only: mark a gallery as THE
    featured one shown on the homepage - unsets any other currently-
    featured gallery, since only one is shown at a time. Homepage-wide
    featuring is deliberately not delegated to Department Admins."""

    permission_classes = [IsChurchAdminOrMediaTeam]

    def post(self, request, pk):
        gallery = Gallery.objects.filter(pk=pk, is_deleted=False).first()
        if not gallery:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        make_featured = request.data.get('featured', True)
        if make_featured:
            Gallery.objects.filter(is_featured=True).exclude(pk=gallery.pk).update(is_featured=False)
        gallery.is_featured = bool(make_featured)
        gallery.save(update_fields=['is_featured'])
        return Response(GallerySerializer(gallery).data)


class GalleryDuplicateView(APIView):
    """Clone a gallery's metadata (title suffixed, category/department/
    event details) as a new Draft gallery - NOT its photos/videos, to
    avoid duplicating storage. A template-style duplicate, not a full
    copy."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        gallery = Gallery.objects.filter(pk=pk, is_deleted=False).first()
        if not gallery:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, gallery):
            raise PermissionDenied('You do not have permission to manage this gallery.')

        clone = Gallery.objects.create(
            title=f'{gallery.title} (Copy)',
            description=gallery.description,
            category=gallery.category,
            department=gallery.department,
            event_name=gallery.event_name,
            event_theme=gallery.event_theme,
            event_location=gallery.event_location,
            event_date=gallery.event_date,
            visibility=gallery.visibility,
            status='draft',
            created_by=request.user,
        )
        return Response(GallerySerializer(clone).data, status=status.HTTP_201_CREATED)


class AlbumListCreateView(generics.ListCreateAPIView):
    """List/create Albums within a Gallery."""

    serializer_class = AlbumSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _gallery(self):
        return visible_galleries_queryset(self.request.user).filter(pk=self.kwargs['gallery_id']).first()

    def get_queryset(self):
        gallery = self._gallery()
        if not gallery:
            return Album.objects.none()
        qs = gallery.albums.filter(is_deleted=False)
        if not can_manage_gallery_object(self.request.user, gallery):
            qs = qs.filter(status='published')
        return qs

    def perform_create(self, serializer):
        gallery = Gallery.objects.filter(pk=self.kwargs['gallery_id'], is_deleted=False).first()
        if not gallery:
            raise ValidationError({'detail': 'Gallery not found.'})
        if not can_manage_gallery_object(self.request.user, gallery):
            raise PermissionDenied('You do not have permission to manage this gallery.')
        serializer.save(gallery=gallery, created_by=self.request.user)


class AlbumDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve/update an Album (with its items); delete is a soft delete."""

    serializer_class = AlbumDetailSerializer

    def get_queryset(self):
        return Album.objects.filter(is_deleted=False)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self):
        obj = super().get_object()
        if self.request.method != 'GET' and not can_manage_gallery_object(self.request.user, obj.gallery):
            raise PermissionDenied('You do not have permission to manage this album.')
        return obj

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])


class GalleryItemListCreateView(generics.ListCreateAPIView):
    """List/add items directly within a gallery (not filed into an
    album)."""

    serializer_class = GalleryItemSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _gallery(self):
        return visible_galleries_queryset(self.request.user).filter(pk=self.kwargs['gallery_id']).first()

    def get_queryset(self):
        gallery = self._gallery()
        if not gallery:
            return GalleryItem.objects.none()
        return gallery.items.filter(is_deleted=False)

    def perform_create(self, serializer):
        gallery = Gallery.objects.filter(pk=self.kwargs['gallery_id'], is_deleted=False).first()
        if not gallery:
            raise ValidationError({'detail': 'Gallery not found.'})
        if not can_manage_gallery_object(self.request.user, gallery):
            raise PermissionDenied('You do not have permission to manage this gallery.')
        item = serializer.save(gallery=gallery, uploaded_by=self.request.user)
        _auto_publish_on_upload(item)


class GalleryItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Edit or remove (soft delete) a single item - permission is checked
    against the item's parent gallery, so Department Admin scoping applies
    here too."""

    queryset = GalleryItem.objects.filter(is_deleted=False)
    serializer_class = GalleryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if not can_manage_gallery_object(self.request.user, obj.gallery):
            raise PermissionDenied('You do not have permission to manage this item.')
        return obj

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['is_deleted', 'deleted_at'])


class GalleryItemMoveView(APIView):
    """Move a photo/video to a different gallery (and optionally a
    different album within it) - validates the requester can manage BOTH
    the source and target gallery, so a scoped Department Admin can't
    smuggle an item into (or out of) a department they don't administer."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        item = GalleryItem.objects.filter(pk=pk, is_deleted=False).first()
        if not item:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not can_manage_gallery_object(request.user, item.gallery):
            raise PermissionDenied('You do not have permission to move this item.')

        target_gallery = Gallery.objects.filter(pk=request.data.get('gallery'), is_deleted=False).first()
        if not target_gallery:
            raise ValidationError({'gallery': 'Select a valid destination gallery.'})
        if not can_manage_gallery_object(request.user, target_gallery):
            raise PermissionDenied('You do not have permission to move items into that gallery.')

        target_album = None
        album_id = request.data.get('album')
        if album_id:
            target_album = Album.objects.filter(pk=album_id, gallery=target_gallery, is_deleted=False).first()
            if not target_album:
                raise ValidationError({'album': 'Select a valid album within the destination gallery.'})

        item.gallery = target_gallery
        item.album = target_album
        item.save(update_fields=['gallery', 'album'])
        return Response(GalleryItemSerializer(item).data)
