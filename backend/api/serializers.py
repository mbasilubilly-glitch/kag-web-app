from django.contrib.auth.models import User
from rest_framework import serializers
from .models import MemberProfile, Sermon, Event, EventRegistration, PrayerRequest, Ministry, Notification, DeviceToken, ContactMessage, Gallery, GalleryItem, Album, GalleryCategory, MediaTeamMember, LiveStream


class MemberProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberProfile
        fields = [
            'phone', 'role', 'profile_image', 'status',
            'profile_picture', 'gender', 'date_of_birth', 'national_id', 'occupation',
            'marital_status', 'residential_address', 'county', 'town_city',
            'emergency_contact_name', 'emergency_contact_phone',
            'baptized', 'confirmed', 'church_branch', 'member_number',
            'age', 'visitor_address', 'purpose_of_visit', 'service_attended', 'date_of_visit',
            'email_verified', 'phone_verified', 'created_at',
            'membership_upgrade_status', 'membership_upgrade_requested_at',
        ]
        # role/status changes go through the dedicated role-patch/approval
        # endpoints (Super-Admin/Church-Admin gated), never this generic
        # self-service profile PUT/PATCH - role in particular must stay
        # read-only here, since it's otherwise a privilege-escalation path
        # (any signed-in user could PATCH their own profile.role to
        # Administrator). profile_picture is uploaded via the dedicated
        # multipart endpoint (see ProfilePictureUploadView), not this one.
        # member_number/baptized/confirmed/church_branch/email_verified/
        # phone_verified/created_at are admin-recorded facts, not
        # self-editable. The rest (contact/demographic info) members can
        # update about themselves. membership_upgrade_status/requested_at
        # go through the dedicated membership-upgrade request/decision
        # endpoints (see views_membership_upgrade.py), not this generic PUT.
        read_only_fields = [
            'role', 'status', 'profile_picture',
            'baptized', 'confirmed', 'church_branch', 'member_number',
            'age', 'visitor_address', 'purpose_of_visit', 'service_attended', 'date_of_visit',
            'email_verified', 'phone_verified', 'created_at',
            'membership_upgrade_status', 'membership_upgrade_requested_at',
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = MemberProfileSerializer(required=False)
    is_media_team = serializers.SerializerMethodField()
    ministries = serializers.SerializerMethodField()
    cell_group = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 'is_staff', 'is_superuser', 'is_media_team', 'ministries', 'cell_group', 'date_joined', 'last_login']
        read_only_fields = ['is_staff', 'is_superuser', 'date_joined', 'last_login']

    def get_is_media_team(self, obj):
        return hasattr(obj, 'media_team_membership')

    def get_ministries(self, obj):
        return [m.ministry.ministry_name for m in obj.ministry_enrollments.all()]

    def get_cell_group(self, obj):
        enrollment = getattr(obj, 'homecell_enrollment', None)
        return enrollment.homecell.ministry_name if enrollment else None

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        user = super().update(instance, validated_data)
        if profile_data is not None:
            profile, _ = MemberProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # Role is accepted from client for backward compatibility, but the backend forces defaults.
    role = serializers.ChoiceField(write_only=True, choices=MemberProfile.ROLE_CHOICES, default='Visitor')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        requested_role = validated_data.pop('role', 'Visitor')

        # Public users must not self-register as privileged roles.
        if requested_role in ('Administrator', 'Pastor'):
            raise serializers.ValidationError({'role': 'You cannot self-register as an administrator.'})

        # HARD RULE: enforce approval workflow defaults.
        # New accounts always start as PENDING_APPROVAL and non-admin role.
        role = requested_role if requested_role in ('Visitor', 'Member', 'Ministry Leader') else 'Visitor'

        username = validated_data['username']
        email = validated_data['email']

        # Avoid 500s from DB unique constraints; return a clean 400 instead.
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})

        user = User(
            username=username,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()

        MemberProfile.objects.create(
            user=user,
            phone=phone,
            role=role,
            status='PENDING_APPROVAL',
            email_verified=False,
            phone_verified=False,
        )
        return user



class SermonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sermon
        fields = '__all__'


class LiveStreamSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LiveStream
        fields = ['id', 'url', 'updated_at', 'updated_by_name']
        read_only_fields = ['id', 'updated_at', 'updated_by_name']

    def get_updated_by_name(self, obj):
        if not obj.updated_by:
            return None
        return obj.updated_by.get_full_name() or obj.updated_by.username


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ['created_at', 'status', 'user']


class PrayerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'status']


class MinistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministry
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = '__all__'
        read_only_fields = ['created_at']




class GalleryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at']


class GalleryItemSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GalleryItem
        fields = [
            'id', 'gallery', 'album', 'item_type', 'title', 'image', 'video_url', 'thumbnail',
            'caption', 'tags', 'order', 'status', 'is_deleted', 'deleted_at', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['created_at', 'gallery', 'is_deleted', 'deleted_at']

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ''
        full_name = f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip()
        return full_name or obj.uploaded_by.username


class AlbumSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    photo_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Album
        fields = [
            'id', 'gallery', 'name', 'description', 'cover_image', 'status',
            'is_deleted', 'deleted_at', 'created_by_name', 'photo_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'gallery', 'is_deleted', 'deleted_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return full_name or obj.created_by.username


class AlbumDetailSerializer(AlbumSerializer):
    items = serializers.SerializerMethodField()

    class Meta(AlbumSerializer.Meta):
        fields = AlbumSerializer.Meta.fields + ['items']

    def get_items(self, obj):
        qs = obj.items.filter(is_deleted=False)
        if not self.context.get('can_manage'):
            qs = qs.filter(status='published')
        return GalleryItemSerializer(qs, many=True, context=self.context).data


class GallerySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.ministry_name', read_only=True, default='')
    category_name = serializers.CharField(source='category.name', read_only=True)
    item_count = serializers.IntegerField(source='items.count', read_only=True)
    album_count = serializers.IntegerField(source='albums.count', read_only=True)

    class Meta:
        model = Gallery
        fields = [
            'id', 'title', 'description', 'category', 'category_name', 'department', 'department_name',
            'event_name', 'event_theme', 'event_location', 'event_date',
            'visibility', 'status', 'published_at', 'is_featured', 'cover_image',
            'is_deleted', 'deleted_at', 'created_by_name', 'item_count', 'album_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'published_at', 'is_deleted', 'deleted_at']

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return full_name or obj.created_by.username


class GalleryDetailSerializer(GallerySerializer):
    items = serializers.SerializerMethodField()
    albums = serializers.SerializerMethodField()

    class Meta(GallerySerializer.Meta):
        fields = GallerySerializer.Meta.fields + ['items', 'albums']

    def _can_manage(self):
        # Set by the view (GalleryDetailView.get_serializer_context) -
        # can't import views_gallery here without a circular import, so the
        # view computes it and hands it over via context.
        return bool(self.context.get('can_manage'))

    def get_items(self, obj):
        # Only items directly on the gallery (not filed into an album) -
        # album items are reached via their own album's `items`. Excludes
        # soft-deleted always; excludes draft/archived items unless the
        # requester can manage this gallery.
        qs = obj.items.filter(is_deleted=False, album__isnull=True)
        if not self._can_manage():
            qs = qs.filter(status='published')
        return GalleryItemSerializer(qs, many=True, context=self.context).data

    def get_albums(self, obj):
        qs = obj.albums.filter(is_deleted=False)
        if not self._can_manage():
            qs = qs.filter(status='published')
        serializer = AlbumDetailSerializer(qs, many=True, context=self.context)
        return serializer.data


class MediaTeamMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.profile.phone', read_only=True, default='')
    profile_picture = serializers.ImageField(source='user.profile.profile_picture', read_only=True, default=None)
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MediaTeamMember
        fields = [
            'id', 'user', 'user_name', 'username', 'email', 'phone', 'profile_picture',
            'role', 'status', 'is_active', 'added_by_name', 'created_at',
        ]
        read_only_fields = ['created_at', 'status']

    def get_user_name(self, obj):
        full_name = f'{obj.user.first_name} {obj.user.last_name}'.strip()
        return full_name or obj.user.username

    def get_added_by_name(self, obj):
        if not obj.added_by:
            return ''
        full_name = f'{obj.added_by.first_name} {obj.added_by.last_name}'.strip()
        return full_name or obj.added_by.username


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['created_at', 'replied_at', 'user']

