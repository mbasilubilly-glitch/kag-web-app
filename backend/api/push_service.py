import json
import logging
import os

from django.conf import settings
from pywebpush import webpush

from .models import DeviceToken

logger = logging.getLogger(__name__)


def get_vapid_private_key():
    key = os.getenv('VAPID_PRIVATE_KEY') or getattr(settings, 'VAPID_PRIVATE_KEY', None)
    if not key:
        raise RuntimeError('Missing VAPID_PRIVATE_KEY')
    return key


def get_vapid_claims():
    return {
        'sub': os.getenv('VAPID_SUBJECT')
        or getattr(settings, 'VAPID_SUBJECT', None)
        or 'mailto:admin@example.com',
    }


def _send_to_tokens(tokens, payload, vapid_private_key, vapid_claims):
    """Delivers to every token independently and keeps going regardless of
    what goes wrong with any individual one - a stale/revoked subscription
    (WebPushException) and a network/TLS failure reaching the push service
    at all (requests.exceptions.RequestException, which pywebpush can also
    raise directly and is NOT a WebPushException) are both just "this one
    delivery failed", never a reason to abandon the rest of the batch.
    Returns (sent_count, failed_count)."""
    sent = 0
    failed = 0
    for token in tokens:
        sub = {
            'endpoint': token.endpoint,
            'keys': {
                'p256dh': token.p256dh,
                'auth': token.auth,
            },
        }
        try:
            webpush(
                sub,
                data=json.dumps(payload),
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims,
            )
            sent += 1
        except Exception:
            failed += 1
            logger.warning('Push delivery failed for endpoint %s', token.endpoint, exc_info=True)
    return sent, failed


def send_push_to_user(title: str, body: str, user, url: str = '/notifications/'):
    payload = {'title': title, 'body': body, 'url': url}
    vapid_private_key = get_vapid_private_key()
    vapid_claims = get_vapid_claims()
    tokens = DeviceToken.objects.filter(user=user)
    return _send_to_tokens(tokens, payload, vapid_private_key, vapid_claims)


def send_push_to_all(title: str, body: str, url: str = '/notifications/'):
    payload = {'title': title, 'body': body, 'url': url}
    vapid_private_key = get_vapid_private_key()
    vapid_claims = get_vapid_claims()
    tokens = DeviceToken.objects.all()
    return _send_to_tokens(tokens, payload, vapid_private_key, vapid_claims)


def send_push_to_users(title: str, body: str, user_ids, url: str = '/notifications/'):
    payload = {'title': title, 'body': body, 'url': url}
    vapid_private_key = get_vapid_private_key()
    vapid_claims = get_vapid_claims()
    tokens = DeviceToken.objects.filter(user_id__in=user_ids)
    return _send_to_tokens(tokens, payload, vapid_private_key, vapid_claims)

