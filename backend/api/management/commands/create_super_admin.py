import secrets

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from api.models import MemberProfile


class Command(BaseCommand):
    """Creates the system's one and only Super Administrator account.

    Per the platform's role model, the Super Administrator is never
    self-registered — it's provisioned once during system installation.
    Refuses to create a second one unless --force is passed.
    """

    help = "Create the Super Administrator account (system initialization only)."

    def add_arguments(self, parser):
        parser.add_argument('--username', default='superadmin')
        parser.add_argument('--email', required=True)
        parser.add_argument('--password', default=None, help='If omitted, a secure password is generated.')
        parser.add_argument('--force', action='store_true', help='Create even if a Super Administrator already exists.')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password'] or secrets.token_urlsafe(12)
        force = options['force']

        existing_super_admin = User.objects.filter(is_superuser=True).exclude(username=username).first()
        if existing_super_admin and not force:
            raise CommandError(
                f"A Super Administrator already exists ('{existing_super_admin.username}'). "
                "There is only one Super Administrator in this system. Pass --force to create another anyway."
            )

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email, 'is_staff': True, 'is_superuser': True},
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        MemberProfile.objects.update_or_create(
            user=user,
            defaults={
                'role': 'Administrator',
                'status': 'ACTIVE',
                'email_verified': True,
                'phone_verified': True,
            },
        )

        self.stdout.write(self.style.SUCCESS(
            f"\nSuper Administrator {'created' if created else 'updated'}.\n"
            f"  Username: {username}\n"
            f"  Email:    {email}\n"
            f"  Password: {password}\n\n"
            "Store this password securely and change it after first login."
        ))
