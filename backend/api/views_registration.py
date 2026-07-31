from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .serializers_registration import MemberRegisterSerializer, VisitorRegisterSerializer


class MemberRegisterView(generics.CreateAPIView):
    """Public Member registration. Starts a new account at PENDING_APPROVAL
    - a Church Administrator reviews and approves it directly, no email
    verification step."""

    serializer_class = MemberRegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                'detail': (
                    'Thank you. Your registration has been received. '
                    'A Church Administrator will review your application. '
                    'You will be able to sign in once approved.'
                ),
                'user_id': user.id,
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VisitorRegisterView(generics.CreateAPIView):
    """Public Visitor registration — immediate active access, no approval queue."""

    serializer_class = VisitorRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'detail': 'Welcome! Your visitor account is ready — you can sign in now.',
                'user_id': user.id,
                'email': user.email,
            },
            status=status.HTTP_201_CREATED,
        )
