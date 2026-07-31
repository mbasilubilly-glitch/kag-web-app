from rest_framework import serializers

from .models_department_attendance import DepartmentAttendanceSession, DepartmentAttendanceRecord


class DepartmentAttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentAttendanceSession
        fields = ['id', 'ministry', 'title', 'session_date', 'start_time', 'end_time', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'ministry', 'created_at', 'updated_at']


class DepartmentAttendanceRecordSerializer(serializers.ModelSerializer):
    member_first_name = serializers.CharField(source='member.first_name', read_only=True)
    member_last_name = serializers.CharField(source='member.last_name', read_only=True)

    class Meta:
        model = DepartmentAttendanceRecord
        fields = ['id', 'session', 'member', 'member_first_name', 'member_last_name', 'status', 'marked_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'marked_by', 'created_at', 'updated_at', 'session']


class DepartmentAttendanceMarkRequestSerializer(serializers.Serializer):
    records = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False,
    )

    def validate_records(self, value):
        cleaned = []
        for item in value:
            member_id = item.get('member_id')
            status = item.get('status')
            cleaned.append({'member_id': member_id, 'status': status})
        for c in cleaned:
            if c['member_id'] is None:
                raise serializers.ValidationError('Each record requires member_id.')
            valid_statuses = dict(DepartmentAttendanceRecord.STATUS_CHOICES)
            if c['status'] not in valid_statuses:
                raise serializers.ValidationError(f"Each record requires status to be one of: {', '.join(valid_statuses)}.")
        return cleaned


class DepartmentAttendanceSessionWithRecordsSerializer(serializers.ModelSerializer):
    records = DepartmentAttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = DepartmentAttendanceSession
        fields = ['id', 'ministry', 'title', 'session_date', 'start_time', 'end_time', 'notes', 'records', 'created_at', 'updated_at']
