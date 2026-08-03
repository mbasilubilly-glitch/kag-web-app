from rest_framework import generics, permissions, status

from rest_framework.response import Response
from django.db import transaction

from .models import MemberHomecell, MemberMinistry, Ministry
from .serializers_homecells import (
    HomecellSerializer,
    MemberDepartmentRegisterSerializer,
    MemberMinistrySerializer,
    MemberHomecellSerializer,
)
from .homecells_defaults import HOME_CELL_OPTIONS, MINISTRY_OPTIONS


def seed_if_empty():
    # Seed Homecells (Ministry rows tagged category='homecell' - see Ministry.category)
    if Ministry.objects.filter(category='homecell').count() == 0:
        for opt in HOME_CELL_OPTIONS:
            Ministry.objects.create(ministry_name=opt['name'], description='', leader='', category='homecell')

    # Seed Ministries
    if Ministry.objects.filter(category='ministry').count() == 0:
        for opt in MINISTRY_OPTIONS:
            # We map "name" -> ministry_name and keep other fields blank.
            Ministry.objects.create(
                ministry_name=opt['name'],
                description='',
                leader='',
            )


class HomecellListView(generics.ListAPIView):
    queryset = Ministry.objects.filter(category='homecell', is_deleted=False).order_by('ministry_name')
    serializer_class = HomecellSerializer
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        seed_if_empty()
        return super().get(request, *args, **kwargs)


class MemberDepartmentsMeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        seed_if_empty()

        # homecell
        try:
            enrollment = MemberHomecell.objects.get(user=request.user)
        except MemberHomecell.DoesNotExist:
            enrollment = None

        ministries_qs = MemberMinistry.objects.filter(user=request.user).select_related('ministry')

        if not enrollment:
            return Response(
                {
                    'homecell': None,
                    'ministries': MemberMinistrySerializer(ministries_qs, many=True).data,
                }
            )

        return Response(
            {
                'homecell': HomecellSerializer(enrollment.homecell).data,
                'ministries': MemberMinistrySerializer(ministries_qs, many=True).data,
            }
        )


class MemberDepartmentsRegisterView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MemberDepartmentRegisterSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        seed_if_empty()

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        homecell_id = serializer.validated_data['homecell_id']
        ministry_ids = serializer.validated_data['ministry_ids']

        # validate homecell
        homecell = Ministry.objects.filter(id=homecell_id, category='homecell', is_deleted=False).first()
        if not homecell:
            return Response({'detail': 'Selected homecell is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        ministries = Ministry.objects.filter(id__in=ministry_ids, category='ministry', is_deleted=False)
        if ministries.count() != len(ministry_ids):
            return Response({'detail': 'One or more ministries are invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        # Upsert homecell
        MemberHomecell.objects.update_or_create(user=request.user, defaults={'homecell': homecell})

        # Ministries: joining is subject to approval (see MemberMinistry.status),
        # so this no longer replaces the whole set on every save. Newly
        # submitted ministries start a PENDING request; ministries dropped
        # from the submission are left immediately (no approval needed to
        # leave); ministries already present (PENDING/APPROVED/REJECTED)
        # keep their existing status untouched.
        existing = MemberMinistry.objects.filter(user=request.user)
        existing_ids = set(existing.values_list('ministry_id', flat=True))
        submitted_ids = set(m.id for m in ministries)

        existing.exclude(ministry_id__in=submitted_ids).delete()

        new_ids = submitted_ids - existing_ids
        if new_ids:
            MemberMinistry.objects.bulk_create([
                MemberMinistry(user=request.user, ministry_id=mid, status='PENDING')
                for mid in new_ids
            ])

        return Response({'detail': 'Departments updated successfully.'}, status=status.HTTP_200_OK)

