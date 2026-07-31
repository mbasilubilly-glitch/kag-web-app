from django.contrib import admin
from .models import Sermon, Event, PrayerRequest, Ministry, Notification, DeviceToken, MemberProfile
from .models_children_ministry import GuardianProfile, ChildProfile, ChildMedicalInfo, ChildAttendanceSession, ChildAttendanceRecord
from .models_security_questions import SecurityQuestion
from .models_online_meetings import (
    OnlineMeeting,
    OnlineMeetingAttachment,
    OnlineMeetingAttendance,
    OnlineMeetingPoll,
    OnlineMeetingQuestion,
)

admin.site.register(Sermon)
admin.site.register(Event)
admin.site.register(PrayerRequest)
admin.site.register(Ministry)
admin.site.register(Notification)
admin.site.register(DeviceToken)
admin.site.register(MemberProfile)
admin.site.register(GuardianProfile)
admin.site.register(ChildProfile)
admin.site.register(ChildMedicalInfo)
admin.site.register(ChildAttendanceSession)
admin.site.register(ChildAttendanceRecord)
admin.site.register(OnlineMeeting)
admin.site.register(OnlineMeetingAttachment)
admin.site.register(OnlineMeetingAttendance)
admin.site.register(OnlineMeetingPoll)
admin.site.register(OnlineMeetingQuestion)
admin.site.register(SecurityQuestion)
