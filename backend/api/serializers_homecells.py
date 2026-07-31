from rest_framework import serializers
from .models import MemberHomecell, MemberMinistry, Ministry


class HomecellSerializer(serializers.ModelSerializer):
    # Homecells are Ministry rows tagged category='homecell' (see Ministry.category);
    # exposed as `name` here to match the old dedicated-model shape the frontend expects.
    name = serializers.CharField(source='ministry_name')

    class Meta:
        model = Ministry
        fields = ['id', 'name']


class MemberHomecellSerializer(serializers.ModelSerializer):
    homecell = HomecellSerializer(read_only=True)

    class Meta:
        model = MemberHomecell
        fields = ['homecell', 'created_at', 'updated_at']


class MemberMinistrySerializer(serializers.ModelSerializer):
    ministry = serializers.SerializerMethodField()

    class Meta:
        model = MemberMinistry
        fields = ['id', 'ministry', 'status', 'created_at']

    def get_ministry(self, obj):
        return {
            'id': obj.ministry.id,
            'ministry_name': obj.ministry.ministry_name,
            'leader': obj.ministry.leader,
            'description': obj.ministry.description,
        }


class MemberDepartmentRegisterSerializer(serializers.Serializer):
    homecell_id = serializers.IntegerField()
    ministry_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, max_length=50
    )


class MemberDepartmentsResponseSerializer(serializers.Serializer):
    homecell = HomecellSerializer()
    ministries = MemberMinistrySerializer(many=True)

