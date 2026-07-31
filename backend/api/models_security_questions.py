from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import models


def normalize_answer(raw_answer):
    """Answers are matched case/whitespace-insensitively - a member who
    typed "Nairobi" at setup shouldn't get locked out for typing "nairobi"
    during a reset."""
    return (raw_answer or '').strip().lower()


class SecurityQuestion(models.Model):
    """A member-configured question/answer pair used to reset a forgotten
    password without email or SMS. The answer is hashed exactly like a
    password (django.contrib.auth.hashers) - never stored or exposed in
    plain text."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='security_questions',
    )
    question = models.CharField(max_length=255)
    answer_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'question'], name='unique_user_security_question'),
        ]

    def set_answer(self, raw_answer):
        self.answer_hash = make_password(normalize_answer(raw_answer))

    def check_answer(self, raw_answer):
        return check_password(normalize_answer(raw_answer), self.answer_hash)

    def __str__(self):
        return f"{self.user_id}: {self.question}"
