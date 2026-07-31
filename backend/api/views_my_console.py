from rest_framework import generics, permissions, serializers

from .models import EventRegistration, PrayerRequest
from .models_department_attendance import DepartmentAttendanceRecord


class MyEventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateTimeField(source='event.date', read_only=True)
    event_venue = serializers.CharField(source='event.venue', read_only=True)

    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'event_title', 'event_date', 'event_venue', 'status', 'created_at']


class MyEventRegistrationsView(generics.ListAPIView):
    """A member/visitor's own event registrations - EventRegistrationListCreateView's
    GET is Church-Admin-only (see its docstring), so this is the
    self-service equivalent, scoped to request.user only."""

    serializer_class = MyEventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            EventRegistration.objects.filter(user=self.request.user)
            .select_related('event')
            .order_by('-created_at')
        )


class MyPrayerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerRequest
        fields = ['id', 'request', 'status', 'created_at']


class MyPrayerRequestsView(generics.ListAPIView):
    """A member/visitor's own prayer requests - PrayerRequestListCreateView's
    GET is Church-Admin-only (these are sensitive submissions), so this is
    the self-service equivalent, scoped to request.user only."""

    serializer_class = MyPrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrayerRequest.objects.filter(user=self.request.user).order_by('-created_at')


class MyAttendanceRecordSerializer(serializers.ModelSerializer):
    session_title = serializers.CharField(source='session.title', read_only=True)
    session_date = serializers.DateField(source='session.session_date', read_only=True)
    ministry_name = serializers.CharField(source='session.ministry.ministry_name', read_only=True)

    class Meta:
        model = DepartmentAttendanceRecord
        fields = ['id', 'session_title', 'session_date', 'ministry_name', 'status', 'created_at']


class MyAttendanceRecordsView(generics.ListAPIView):
    """A member's own department/homecell attendance history - detailed
    per-session list, complementary to /my-activity-summary/'s aggregated
    trend chart."""

    serializer_class = MyAttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            DepartmentAttendanceRecord.objects.filter(member=self.request.user)
            .select_related('session', 'session__ministry')
            .order_by('-session__session_date')
        )
