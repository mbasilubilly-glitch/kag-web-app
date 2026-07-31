from rest_framework import serializers

from .models import Ministry


class HomecellAdminSerializer(serializers.ModelSerializer):
    """Admin-facing Home Cell Fellowship serializer. `category` is always
    forced to 'homecell' server-side (see HomecellAdminListCreateView), never
    client-writable, so this endpoint can never create/edit a regular
    Ministry/department row."""

    admin_count = serializers.SerializerMethodField()

    class Meta:
        model = Ministry
        fields = [
            'id', 'ministry_name', 'description', 'leader',
            'meeting_day', 'meeting_time', 'meeting_venue',
            'physical_address', 'area_location', 'county', 'church_branch',
            'contact_phone', 'contact_email', 'max_capacity',
            'status', 'category', 'admin_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'category', 'admin_count', 'created_at', 'updated_at']

    def get_admin_count(self, obj):
        return obj.admin_assignments.count()
