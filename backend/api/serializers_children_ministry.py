from rest_framework import serializers

from .models_children_ministry import (
    GuardianProfile,
    ChildProfile,
    ChildMedicalInfo,
    ChildAttendanceSession,
    ChildAttendanceRecord,
)



class GuardianProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardianProfile
        fields = ['id', 'user', 'full_name', 'phone', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class GuardianProfileCreateSerializer(serializers.ModelSerializer):
    """Admin can create a guardian for an existing auth user."""

    class Meta:
        model = GuardianProfile
        fields = ['id', 'user', 'full_name', 'phone', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChildProfileSerializer(serializers.ModelSerializer):
    guardians = serializers.PrimaryKeyRelatedField(
        queryset=GuardianProfile.objects.all(),
        many=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = ChildProfile
        fields = ['id', 'name', 'gender', 'date_of_birth', 'guardians', 'created_at', 'updated_at']


class ChildMedicalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildMedicalInfo
        fields = [
            'id',
            'child',
            'allergies',
            'medications',
            'conditions',
            'emergency_contact_name',
            'emergency_contact_phone',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChildAttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildAttendanceSession
        fields = ['id', 'title', 'session_date', 'start_time', 'end_time', 'notes', 'created_at', 'updated_at']


class ChildAttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildAttendanceRecord
        fields = ['id', 'session', 'child', 'status', 'marked_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'marked_by', 'created_at', 'updated_at', 'session']


class ChildAttendanceMarkRequestSerializer(serializers.Serializer):
    records = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_records(self, value):
        cleaned = []
        for item in value:
            child_id = item.get('child_id')
            status = item.get('status')
            cleaned.append({'child_id': child_id, 'status': status})
        # Basic validation: status must be present and either 'present'/'absent'
        for c in cleaned:
            if c['child_id'] is None:
                raise serializers.ValidationError('Each record requires child_id.')
            if c['status'] not in ('present', 'absent'):
                raise serializers.ValidationError('Each record requires status to be present or absent.')
        return cleaned


class ChildAttendanceSessionWithRecordsSerializer(serializers.ModelSerializer):
    records = ChildAttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ChildAttendanceSession
        fields = ['id', 'title', 'session_date', 'start_time', 'end_time', 'notes', 'records', 'created_at', 'updated_at']

