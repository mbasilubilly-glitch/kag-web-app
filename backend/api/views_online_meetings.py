from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MemberMinistry, Notification, PrayerRequest
from .models_online_meetings import (
    OnlineMeeting,
    OnlineMeetingAttachment,
    OnlineMeetingAttendance,
    OnlineMeetingPoll,
    OnlineMeetingPollOption,
    OnlineMeetingPollVote,
    OnlineMeetingQuestion,
)
from .permissions import IsOnlineMeetingAdminOrReadOnly, is_church_admin, is_department_admin_for
from .push_service import send_push_to_all, send_push_to_users
from .serializers import PrayerRequestSerializer
from .serializers_online_meetings import (
    OnlineMeetingAttachmentSerializer,
    OnlineMeetingPollSerializer,
    OnlineMeetingQuestionSerializer,
    OnlineMeetingSerializer,
)


def _notify_new_session(meeting):
    """Broadcasts a Notification + push about a newly created session -
    to everyone if it's church-wide, otherwise only to approved members of
    its ministry. Push delivery is best-effort: VAPID may not be
    configured in every environment, so a RuntimeError there must never
    fail the request that created the meeting."""
    Notification.objects.create(
        title=f'New online session: {meeting.title}',
        message=f'{meeting.title} on {meeting.meeting_date} at {meeting.start_time.strftime("%H:%M")}.',
    )
    try:
        if meeting.ministry_id:
            member_ids = list(
                MemberMinistry.objects.filter(ministry_id=meeting.ministry_id, status='APPROVED')
                .values_list('user_id', flat=True)
            )
            if member_ids:
                send_push_to_users(
                    'New Online Session',
                    meeting.title,
                    member_ids,
                    url=f'/ministries/{meeting.ministry_id}/meetings',
                )
        else:
            send_push_to_all('New Online Session', meeting.title, url='/dashboard')
    except RuntimeError:
        pass


class OnlineMeetingListCreateView(generics.ListCreateAPIView):
    serializer_class = OnlineMeetingSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = OnlineMeeting.objects.select_related('ministry', 'created_by').order_by('meeting_date', 'start_time')
        ministry_id = self.request.query_params.get('ministry')
        if ministry_id is not None:
            qs = qs.filter(ministry_id=ministry_id)

        status_filter = self.request.query_params.get('status')
        if status_filter == 'upcoming':
            qs = qs.filter(is_cancelled=False)
            ids = [m.id for m in qs if m.status in ('Upcoming', 'Live')]
            qs = qs.filter(id__in=ids)
        elif status_filter == 'past':
            ids = [m.id for m in qs if m.status in ('Ended', 'Cancelled')]
            qs = qs.filter(id__in=ids)
        return qs

    def perform_create(self, serializer):
        ministry = serializer.validated_data.get('ministry')
        if ministry is not None:
            if not is_department_admin_for(self.request.user, ministry.id):
                raise PermissionDenied('You do not administer this department.')
        else:
            if not is_church_admin(self.request.user):
                raise PermissionDenied('Only church administrators can create church-wide sessions.')
        meeting = serializer.save(created_by=self.request.user)
        _notify_new_session(meeting)


class OnlineMeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OnlineMeeting.objects.select_related('ministry', 'created_by')
    serializer_class = OnlineMeetingSerializer
    permission_classes = [IsOnlineMeetingAdminOrReadOnly]


class OnlineMeetingJoinView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            meeting = OnlineMeeting.objects.get(pk=pk)
        except OnlineMeeting.DoesNotExist:
            raise NotFound('Session not found.')

        if not meeting.is_joinable:
            raise ValidationError('This session is not currently joinable.')

        attendance, _created = OnlineMeetingAttendance.objects.get_or_create(
            meeting=meeting, user=request.user,
        )
        return Response(
            {
                'meeting_link': meeting.meeting_link,
                'joined_at': attendance.joined_at,
            },
            status=status.HTTP_200_OK,
        )


class MyOnlineMeetingAttendanceStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        attended_ids = set(
            OnlineMeetingAttendance.objects.filter(user=user).values_list('meeting_id', flat=True)
        )
        attended = len(attended_ids)

        my_ministry_ids = list(
            MemberMinistry.objects.filter(user=user, status='APPROVED').values_list('ministry_id', flat=True)
        )
        eligible = OnlineMeeting.objects.filter(ministry_id__in=my_ministry_ids, is_cancelled=False)
        ended_ids = [m.id for m in eligible if m.status == 'Ended']
        missed = len([mid for mid in ended_ids if mid not in attended_ids])

        total = attended + missed
        rate = round((attended / total) * 100, 1) if total else 0.0

        return Response({
            'attended': attended,
            'missed': missed,
            'attendance_rate': rate,
        })


class OnlineMeetingAttachmentListCreateView(generics.ListCreateAPIView):
    serializer_class = OnlineMeetingAttachmentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def _meeting(self):
        try:
            return OnlineMeeting.objects.get(pk=self.kwargs['pk'])
        except OnlineMeeting.DoesNotExist:
            raise NotFound('Session not found.')

    def get_queryset(self):
        return OnlineMeetingAttachment.objects.filter(meeting_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        meeting = self._meeting()
        allowed = is_department_admin_for(self.request.user, meeting.ministry_id) if meeting.ministry_id else is_church_admin(self.request.user)
        if not allowed:
            raise PermissionDenied('You do not administer this session.')
        serializer.save(meeting=meeting)


class OnlineMeetingAttachmentDetailView(generics.DestroyAPIView):
    queryset = OnlineMeetingAttachment.objects.all()
    serializer_class = OnlineMeetingAttachmentSerializer

    def perform_destroy(self, instance):
        meeting = instance.meeting
        allowed = is_department_admin_for(self.request.user, meeting.ministry_id) if meeting.ministry_id else is_church_admin(self.request.user)
        if not allowed:
            raise PermissionDenied('You do not administer this session.')
        instance.delete()


class OnlineMeetingPollListCreateView(generics.ListCreateAPIView):
    serializer_class = OnlineMeetingPollSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OnlineMeetingPoll.objects.filter(meeting_id=self.kwargs['pk']).prefetch_related('options', 'votes')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        try:
            meeting = OnlineMeeting.objects.get(pk=self.kwargs['pk'])
        except OnlineMeeting.DoesNotExist:
            raise NotFound('Session not found.')
        allowed = is_department_admin_for(self.request.user, meeting.ministry_id) if meeting.ministry_id else is_church_admin(self.request.user)
        if not allowed:
            raise PermissionDenied('You do not administer this session.')
        serializer.save(meeting=meeting)


class OnlineMeetingPollVoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            poll = OnlineMeetingPoll.objects.get(pk=pk)
        except OnlineMeetingPoll.DoesNotExist:
            raise NotFound('Poll not found.')

        option_id = request.data.get('option')
        try:
            option = poll.options.get(pk=option_id)
        except OnlineMeetingPollOption.DoesNotExist:
            raise ValidationError('Invalid option for this poll.')

        OnlineMeetingPollVote.objects.update_or_create(
            poll=poll, user=request.user,
            defaults={'option': option},
        )
        serializer = OnlineMeetingPollSerializer(poll, context={'request': request})
        return Response(serializer.data)


class OnlineMeetingQuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = OnlineMeetingQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OnlineMeetingQuestion.objects.filter(meeting_id=self.kwargs['pk']).select_related('user')

    def perform_create(self, serializer):
        try:
            meeting = OnlineMeeting.objects.get(pk=self.kwargs['pk'])
        except OnlineMeeting.DoesNotExist:
            raise NotFound('Session not found.')
        serializer.save(meeting=meeting, user=self.request.user)


class OnlineMeetingQuestionAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            question = OnlineMeetingQuestion.objects.select_related('meeting').get(pk=pk)
        except OnlineMeetingQuestion.DoesNotExist:
            raise NotFound('Question not found.')

        meeting = question.meeting
        allowed = is_department_admin_for(request.user, meeting.ministry_id) if meeting.ministry_id else is_church_admin(request.user)
        if not allowed:
            raise PermissionDenied('You do not administer this session.')

        question.answer_text = request.data.get('answer_text', '')
        question.answered_at = timezone.now()
        question.save(update_fields=['answer_text', 'answered_at'])
        return Response(OnlineMeetingQuestionSerializer(question).data)


class OnlineMeetingPrayerRequestListCreateView(generics.ListCreateAPIView):
    """In-session prayer requests - reuses the existing PrayerRequest model
    (tagged with `meeting`), so church leadership still sees these in the
    regular church-wide Prayer Requests admin view."""
    serializer_class = PrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrayerRequest.objects.filter(meeting_id=self.kwargs['pk']).order_by('-created_at')

    def perform_create(self, serializer):
        try:
            meeting = OnlineMeeting.objects.get(pk=self.kwargs['pk'])
        except OnlineMeeting.DoesNotExist:
            raise NotFound('Session not found.')
        serializer.save(meeting=meeting, user=self.request.user)
