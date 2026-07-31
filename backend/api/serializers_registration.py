from django.contrib.auth.models import User
from rest_framework import serializers

from .models import MemberProfile, Ministry, MemberMinistry


def _validate_new_account(username, email):
    if User.objects.filter(username=username).exists():
        raise serializers.ValidationError({'username': 'This username is already taken.'})
    if User.objects.filter(email=email).exists():
        raise serializers.ValidationError({'email': 'This email is already registered.'})


def _validate_passwords(password, confirm_password):
    if password != confirm_password:
        raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
    if len(password) < 8:
        raise serializers.ValidationError({'password': 'Password must be at least 8 characters.'})


class MemberRegisterSerializer(serializers.Serializer):
    """Public Church Member registration. Admin roles are never accepted here."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    gender = serializers.ChoiceField(choices=MemberProfile.GENDER_CHOICES, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    occupation = serializers.CharField(max_length=150, required=False, allow_blank=True)
    marital_status = serializers.ChoiceField(choices=MemberProfile.MARITAL_STATUS_CHOICES, required=False, allow_blank=True)
    residential_address = serializers.CharField(required=False, allow_blank=True)
    county = serializers.CharField(max_length=100, required=False, allow_blank=True)
    town_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    emergency_contact_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    baptized = serializers.BooleanField(required=False, default=False)
    confirmed = serializers.BooleanField(required=False, default=False)
    preferred_department = serializers.PrimaryKeyRelatedField(
        queryset=Ministry.objects.all(), required=False, allow_null=True, source='preferred_department_obj'
    )
    church_branch = serializers.CharField(max_length=150, required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    agreed_to_policies = serializers.BooleanField()

    def validate_agreed_to_policies(self, value):
        if not value:
            raise serializers.ValidationError('You must agree to the Church Policies to register.')
        return value

    def validate(self, attrs):
        _validate_new_account(attrs['username'], attrs['email'])
        _validate_passwords(attrs['password'], attrs.pop('confirm_password'))
        return attrs

    def create(self, validated_data):
        preferred_department = validated_data.pop('preferred_department_obj', None)
        profile_picture = validated_data.pop('profile_picture', None)

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()

        profile = MemberProfile.objects.create(
            user=user,
            phone=validated_data.get('phone', ''),
            role='Member',
            status='PENDING_APPROVAL',
            email_verified=True,
            phone_verified=False,
            gender=validated_data.get('gender', ''),
            date_of_birth=validated_data.get('date_of_birth'),
            national_id=validated_data.get('national_id', ''),
            occupation=validated_data.get('occupation', ''),
            marital_status=validated_data.get('marital_status', ''),
            residential_address=validated_data.get('residential_address', ''),
            county=validated_data.get('county', ''),
            town_city=validated_data.get('town_city', ''),
            emergency_contact_name=validated_data.get('emergency_contact_name', ''),
            emergency_contact_phone=validated_data.get('emergency_contact_phone', ''),
            baptized=validated_data.get('baptized', False),
            confirmed=validated_data.get('confirmed', False),
            church_branch=validated_data.get('church_branch', ''),
            agreed_to_policies=validated_data.get('agreed_to_policies', False),
            profile_picture=profile_picture,
        )

        if preferred_department:
            MemberMinistry.objects.get_or_create(user=user, ministry=preferred_department)

        return user


class VisitorRegisterSerializer(serializers.Serializer):
    """Public Visitor registration — lighter form, immediate active access."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    gender = serializers.ChoiceField(choices=MemberProfile.GENDER_CHOICES, required=False, allow_blank=True)
    age = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=150)
    visitor_address = serializers.CharField(required=False, allow_blank=True)
    county = serializers.CharField(max_length=100, required=False, allow_blank=True)
    town_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    purpose_of_visit = serializers.CharField(max_length=255, required=False, allow_blank=True)
    service_attended = serializers.CharField(max_length=150, required=False, allow_blank=True)
    date_of_visit = serializers.DateField(required=False, allow_null=True)
    prayer_request = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        _validate_new_account(attrs['username'], attrs['email'])
        _validate_passwords(attrs['password'], attrs.pop('confirm_password'))
        return attrs

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()

        MemberProfile.objects.create(
            user=user,
            phone=validated_data.get('phone', ''),
            role='Visitor',
            # Visitors get immediate access per spec — no approval queue.
            status='ACTIVE',
            email_verified=False,
            phone_verified=False,
            gender=validated_data.get('gender', ''),
            age=validated_data.get('age'),
            visitor_address=validated_data.get('visitor_address', ''),
            county=validated_data.get('county', ''),
            town_city=validated_data.get('town_city', ''),
            purpose_of_visit=validated_data.get('purpose_of_visit', ''),
            service_attended=validated_data.get('service_attended', ''),
            date_of_visit=validated_data.get('date_of_visit'),
            prayer_request=validated_data.get('prayer_request', ''),
        )
        return user
