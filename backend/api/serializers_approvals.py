from rest_framework import serializers


class ApprovalActionSerializer(serializers.Serializer):
    """Admin approve/reject payload."""

    user_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['ACTIVE', 'REJECTED'])

