from rest_framework import serializers

from .models import DepartmentAdminAssignment
from .serializers import UserSerializer, MinistrySerializer


class DepartmentAdminAssignmentSerializer(serializers.ModelSerializer):
    # Readable admin info
    admin = UserSerializer(source='admin_user', read_only=True)

    class Meta:
        model = DepartmentAdminAssignment
        fields = [
            'id',
            'department_id',
            'admin',
            'admin_user_id',
            'church_admin_user_id',
            'assignment_role',
            'duties',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'church_admin_user_id', 'admin']


class MyDepartmentAdminAssignmentSerializer(serializers.ModelSerializer):
    department = MinistrySerializer(read_only=True)

    class Meta:
        model = DepartmentAdminAssignment
        fields = ['id', 'department', 'assignment_role', 'duties', 'created_at']


class DepartmentAdminAssignmentCreateSerializer(serializers.Serializer):
    department_id = serializers.IntegerField()
    admin_user_id = serializers.IntegerField()
    assignment_role = serializers.ChoiceField(choices=DepartmentAdminAssignment.ROLE_CHOICES, required=False, default='leader')
    duties = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if attrs['department_id'] <= 0:
            raise serializers.ValidationError({'department_id': 'Invalid department_id.'})
        if attrs['admin_user_id'] <= 0:
            raise serializers.ValidationError({'admin_user_id': 'Invalid admin_user_id.'})
        return attrs

