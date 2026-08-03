from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models_children_ministry import (
    GuardianProfile,
    ChildProfile,
    ChildMedicalInfo,
    ChildAttendanceSession,
    ChildAttendanceRecord,
)

from .serializers_children_ministry import (
    GuardianProfileCreateSerializer,
    ChildProfileSerializer,
    ChildMedicalInfoSerializer,
    ChildAttendanceSessionSerializer,
    ChildAttendanceMarkRequestSerializer,
    ChildAttendanceSessionWithRecordsSerializer,
)

from .permissions import is_church_admin


class AdminOnlyBase:
    """Lightweight mixin to reuse the repo's admin logic."""

    permission_classes = [permissions.IsAuthenticated]

    def check_admin(self, request):
        if not is_church_admin(request.user):
            raise PermissionDenied('Admin access required')


class GuardianProfileListCreateView(AdminOnlyBase, generics.ListCreateAPIView):
    serializer_class = GuardianProfileCreateSerializer

    def get_queryset(self):
        self.check_admin(self.request)
        return GuardianProfile.objects.select_related('user').all().order_by('full_name')

    def perform_create(self, serializer):
        self.check_admin(self.request)
        serializer.save()


class GuardianProfileDetailView(AdminOnlyBase, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GuardianProfileCreateSerializer
    queryset = GuardianProfile.objects.all()

    def get_object(self):
        self.check_admin(self.request)
        return super().get_object()


class ChildProfileListCreateView(AdminOnlyBase, generics.ListCreateAPIView):
    serializer_class = ChildProfileSerializer

    def get_queryset(self):
        self.check_admin(self.request)
        return ChildProfile.objects.prefetch_related('guardians').all().order_by('name')

    def perform_create(self, serializer):
        self.check_admin(self.request)
        serializer.save()


class ChildProfileDetailView(AdminOnlyBase, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChildProfileSerializer
    queryset = ChildProfile.objects.all()

    def get_object(self):
        self.check_admin(self.request)
        return super().get_object()


class ChildMedicalInfoUpsertView(AdminOnlyBase, generics.GenericAPIView):
    serializer_class = ChildMedicalInfoSerializer

    def get(self, request, child_id):
        self.check_admin(request)
        try:
            obj = ChildMedicalInfo.objects.select_related('child').get(child_id=child_id)
        except ChildMedicalInfo.DoesNotExist:
            return Response({'detail': 'Medical info not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.serializer_class(obj).data)

    @transaction.atomic
    def post(self, request, child_id):
        self.check_admin(request)
        # Upsert pattern: if medical exists, update, else create.
        data = dict(request.data or {})
        data['child'] = int(child_id)

        serializer = self.serializer_class(instance=None, data=data)
        serializer.is_valid(raise_exception=True)

        obj, _ = ChildMedicalInfo.objects.update_or_create(
            child_id=child_id,
            defaults={
                'allergies': serializer.validated_data.get('allergies', ''),
                'medications': serializer.validated_data.get('medications', ''),
                'conditions': serializer.validated_data.get('conditions', ''),
                'emergency_contact_name': serializer.validated_data.get('emergency_contact_name', ''),
                'emergency_contact_phone': serializer.validated_data.get('emergency_contact_phone', ''),
            },
        )
        return Response(self.serializer_class(obj).data, status=status.HTTP_200_OK)


class AttendanceSessionListCreateView(AdminOnlyBase, generics.ListCreateAPIView):
    serializer_class = ChildAttendanceSessionSerializer

    def get_queryset(self):
        self.check_admin(self.request)
        return ChildAttendanceSession.objects.all().order_by('-session_date', '-created_at')

    def perform_create(self, serializer):
        self.check_admin(self.request)
        serializer.save()


class AttendanceSessionDetailView(AdminOnlyBase, generics.RetrieveAPIView):
    serializer_class = ChildAttendanceSessionWithRecordsSerializer
    queryset = ChildAttendanceSession.objects.all()

    def get_object(self):
        self.check_admin(self.request)
        return super().get_object()


class AttendanceMarkView(AdminOnlyBase, generics.GenericAPIView):
    serializer_class = ChildAttendanceMarkRequestSerializer

    @transaction.atomic
    def post(self, request, session_id):
        self.check_admin(request)

        try:
            session = ChildAttendanceSession.objects.get(id=session_id)
        except ChildAttendanceSession.DoesNotExist:
            raise NotFound('Attendance session not found.')
        mark_serializer = self.serializer_class(data=request.data)
        mark_serializer.is_valid(raise_exception=True)

        records = mark_serializer.validated_data['records']

        # Upsert each child status
        created = 0
        updated = 0
        for r in records:
            child_id = r['child_id']
            status_value = r['status']

            obj, was_created = ChildAttendanceRecord.objects.update_or_create(
                session=session,
                child_id=child_id,
                defaults={
                    'status': status_value,
                    'marked_by': request.user,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response(
            {
                'detail': 'Attendance marked.',
                'created': created,
                'updated': updated,
                'session_id': session.id,
            },
            status=status.HTTP_200_OK,
        )

