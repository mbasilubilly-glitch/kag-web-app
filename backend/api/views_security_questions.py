from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import invalidate_existing_tokens
from .models_security_questions import SecurityQuestion
from .serializers_security_questions import (
    SecurityQuestionResetSerializer,
    SecurityQuestionSerializer,
    SetSecurityQuestionsSerializer,
)
from .views_auth_approval import STATUS_MESSAGES

# Shown for an unknown identifier or an account with no security questions
# configured, so this endpoint's response shape never reveals whether an
# account exists or has this reset method available - same anti-enumeration
# stance as PasswordResetSendOTPView.
GENERIC_FALLBACK_QUESTIONS = [
    'What was the name of your first pet?',
    'What city were you born in?',
]


def _resolve_user(identifier):
    identifier = (identifier or '').strip()
    if not identifier:
        return None
    return (
        User.objects.filter(username=identifier).select_related('profile').first()
        or User.objects.filter(email__iexact=identifier).select_related('profile').first()
    )


class MySecurityQuestionsView(APIView):
    """Lets a signed-in member view (question text only) and set/replace
    their own security questions from their Profile page."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = SecurityQuestion.objects.filter(user=request.user).order_by('created_at')
        return Response(SecurityQuestionSerializer(qs, many=True).data)

    def put(self, request):
        serializer = SetSecurityQuestionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        SecurityQuestion.objects.filter(user=request.user).delete()
        for entry in serializer.validated_data['questions']:
            sq = SecurityQuestion(user=request.user, question=entry['question'].strip())
            sq.set_answer(entry['answer'])
            sq.save()

        return Response({'detail': 'Security questions updated.'})


class SecurityQuestionsForIdentifierView(APIView):
    """Public: given a username/email, returns the question text (not
    answers) so a 'forgot password without email' form can render itself."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    def get(self, request):
        user = _resolve_user(request.query_params.get('identifier'))
        questions = list(
            SecurityQuestion.objects.filter(user=user).values_list('question', flat=True)
        ) if user else []

        if len(questions) < 2:
            questions = GENERIC_FALLBACK_QUESTIONS

        return Response({'questions': questions})


class SecurityQuestionResetView(APIView):
    """Public: verifies every configured security answer and, if all
    match, sets a new password directly - no email/SMS code involved.
    Wrong-answer attempts are not counted or auto-locked (unlimited
    attempts, per product decision - see views_auth_approval.py); the
    'otp' scope ScopedRateThrottle below is the only rate limit on this
    brute-forceable account-takeover path."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    def post(self, request):
        serializer = SecurityQuestionResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        generic_error = {'detail': 'Unable to verify your answers.'}

        user = _resolve_user(data['identifier'])
        if user is None:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(user, 'profile', None)
        if profile is not None and profile.status == 'LOCKED':
            raise ValidationError(STATUS_MESSAGES['LOCKED'])

        stored = {sq.question: sq for sq in SecurityQuestion.objects.filter(user=user)}
        if len(stored) < 2:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        provided = {entry['question']: entry['answer'] for entry in data['answers']}

        all_correct = len(provided) >= len(stored) and all(
            question in provided and sq.check_answer(provided[question])
            for question, sq in stored.items()
        )

        if not all_correct:
            return Response(generic_error, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data['new_password'])
        user.save(update_fields=['password'])
        invalidate_existing_tokens(user)

        return Response({'detail': 'Password updated.'})
