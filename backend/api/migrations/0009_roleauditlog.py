from django.db import migrations, models
import django.db.models.deletion
import django.conf


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0008_memberprofile_email_verified_and_more'),
        migrations.swappable_dependency(django.conf.settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='RoleAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('old_role', models.CharField(blank=True, default='', max_length=30)),
                ('new_role', models.CharField(blank=True, default='', max_length=30)),
                ('reason', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'actor',
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='role_audit_actor',
                        to=django.conf.settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'target_user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='role_audit_target',
                        to=django.conf.settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]

