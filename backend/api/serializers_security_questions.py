from rest_framework import serializers

from .models_security_questions import SecurityQuestion


class SecurityQuestionSerializer(serializers.ModelSerializer):
    """Read-only view of a configured question - answer_hash is never
    exposed."""

    class Meta:
        model = SecurityQuestion
        fields = ['id', 'question', 'created_at']


class SecurityQuestionEntrySerializer(serializers.Serializer):
    """One question/answer pair, used both when a member sets their
    questions and when someone answers them during a reset."""

    question = serializers.CharField(max_length=255)
    answer = serializers.CharField(max_length=255)


class SetSecurityQuestionsSerializer(serializers.Serializer):
    questions = SecurityQuestionEntrySerializer(many=True)

    def validate_questions(self, value):
        if not (2 <= len(value) <= 3):
            raise serializers.ValidationError('Set between 2 and 3 security questions.')
        seen = set()
        for entry in value:
            q = entry['question'].strip().lower()
            if q in seen:
                raise serializers.ValidationError('Questions must be unique.')
            seen.add(q)
            if not entry['answer'].strip():
                raise serializers.ValidationError('Every question needs an answer.')
        return value


class SecurityQuestionResetSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    answers = SecurityQuestionEntrySerializer(many=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
