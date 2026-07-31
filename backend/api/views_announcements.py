from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import PermissionDenied

from .models import Announcement, Notification
from .permissions import is_church_admin, is_department_admin_for


class AnnouncementSerializer(serializers.ModelSerializer):
    ministry_name = serializers.CharField(source='ministry.ministry_name', read_only=True, default=None)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'body', 'poster', 'ministry', 'ministry_name', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return full_name or obj.created_by.username


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Announcement.objects.select_related('ministry', 'created_by')
        ministry_id = self.request.query_params.get('ministry')
        if ministry_id is not None:
            qs = qs.filter(ministry_id=ministry_id)
        return qs

    def perform_create(self, serializer):
        ministry = serializer.validated_data.get('ministry')
        if ministry is not None:
            if not is_department_admin_for(self.request.user, ministry.id):
                raise PermissionDenied('You do not administer this department.')
        else:
            if not is_church_admin(self.request.user):
                raise PermissionDenied('Only church administrators can post church-wide announcements.')
        instance = serializer.save(created_by=self.request.user)

        # Every posted announcement raises a notification alert for every
        # signed-in user (a broadcast row, user=None - same visibility rule
        # NotificationListCreateView already applies) - previously posting
        # an announcement was invisible outside whoever happened to open
        # the Announcements page themselves.
        body_preview = instance.body[:200] + ('…' if len(instance.body) > 200 else '')
        Notification.objects.create(
            title=f'New announcement: {instance.title}',
            message=body_preview,
        )


class AnnouncementDetailView(generics.RetrieveDestroyAPIView):
    queryset = Announcement.objects.select_related('ministry', 'created_by')
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        if instance.ministry_id is not None:
            if not is_department_admin_for(self.request.user, instance.ministry_id):
                raise PermissionDenied('You do not administer this department.')
        else:
            if not is_church_admin(self.request.user):
                raise PermissionDenied('Only church administrators can remove church-wide announcements.')
        instance.delete()
