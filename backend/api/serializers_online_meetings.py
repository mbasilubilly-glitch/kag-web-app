from rest_framework import serializers

from .models_online_meetings import (
    OnlineMeeting,
    OnlineMeetingAttachment,
    OnlineMeetingAttendance,
    OnlineMeetingPoll,
    OnlineMeetingPollOption,
    OnlineMeetingPollVote,
    OnlineMeetingQuestion,
)


class OnlineMeetingAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnlineMeetingAttachment
        fields = '__all__'
        read_only_fields = ['uploaded_at']


class OnlineMeetingSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    is_joinable = serializers.ReadOnlyField()
    attendee_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    attachments = OnlineMeetingAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = OnlineMeeting
        fields = '__all__'
        read_only_fields = ['created_by', 'reminder_sent_at', 'created_at', 'updated_at']

    def get_attendee_count(self, obj):
        return obj.attendances.count()

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.get_full_name() or obj.created_by.username


class OnlineMeetingAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnlineMeetingAttendance
        fields = '__all__'
        read_only_fields = ['user', 'joined_at']


class OnlineMeetingPollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.SerializerMethodField()

    class Meta:
        model = OnlineMeetingPollOption
        fields = ['id', 'poll', 'option_text', 'vote_count']
        read_only_fields = ['poll']

    def get_vote_count(self, obj):
        return obj.votes.count()


class OnlineMeetingPollSerializer(serializers.ModelSerializer):
    options = OnlineMeetingPollOptionSerializer(many=True, required=False)
    my_vote_option_id = serializers.SerializerMethodField()

    class Meta:
        model = OnlineMeetingPoll
        fields = ['id', 'meeting', 'question', 'created_at', 'options', 'my_vote_option_id']
        read_only_fields = ['created_at', 'meeting']

    def get_my_vote_option_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        vote = obj.votes.filter(user=request.user).first()
        return vote.option_id if vote else None

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        poll = OnlineMeetingPoll.objects.create(**validated_data)
        for option in options_data:
            OnlineMeetingPollOption.objects.create(poll=poll, **option)
        return poll


class OnlineMeetingPollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnlineMeetingPollVote
        fields = '__all__'
        read_only_fields = ['poll', 'user', 'created_at']


class OnlineMeetingQuestionSerializer(serializers.ModelSerializer):
    asked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OnlineMeetingQuestion
        fields = '__all__'
        read_only_fields = ['user', 'meeting', 'answer_text', 'answered_at', 'created_at']

    def get_asked_by_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
