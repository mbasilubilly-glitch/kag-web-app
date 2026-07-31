from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0009_roleauditlog'),
        migrations.swappable_dependency(django.conf.settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GuardianProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=255)),
                ('phone', models.CharField(blank=True, default='', max_length=30)),
                ('email', models.EmailField(blank=True, default='', max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'user',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='guardian_profile',
                        to=django.conf.settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name='ChildProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('gender', models.CharField(blank=True, default='', help_text='Optional (e.g., Male/Female)', max_length=20)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'guardians',
                    models.ManyToManyField(blank=True, related_name='children', to='api.guardianprofile'),
                ),
            ],
        ),
        migrations.CreateModel(
            name='ChildMedicalInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('allergies', models.TextField(blank=True, default='')),
                ('medications', models.TextField(blank=True, default='')),
                ('conditions', models.TextField(blank=True, default='')),
                ('emergency_contact_name', models.CharField(blank=True, default='', max_length=255)),
                ('emergency_contact_phone', models.CharField(blank=True, default='', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'child',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='medical_info',
                        to='api.childprofile',
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name='ChildAttendanceSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, default='', max_length=255)),
                ('session_date', models.DateField()),
                ('start_time', models.TimeField(blank=True, null=True)),
                ('end_time', models.TimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='ChildAttendanceRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('present', 'Present'), ('absent', 'Absent')], max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'child',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='attendance_records',
                        to='api.childprofile',
                    ),
                ),
                (
                    'marked_by',
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=django.conf.settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'session',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='records',
                        to='api.childattendancesession',
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name='childattendancesession',
            index=models.Index(fields=['session_date'], name='api_childatt_session_idx'),
        ),
    ]
