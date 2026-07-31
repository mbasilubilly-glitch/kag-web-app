from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_roleauditlog'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DepartmentAdminAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('admin_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='department_admin_assignments', to=settings.AUTH_USER_MODEL)),
                ('church_admin_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='department_admin_assignments_assigned', to=settings.AUTH_USER_MODEL)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='admin_assignments', to='api.ministry')),
            ],
            options={
                'constraints': [
                    models.UniqueConstraint(fields=('department', 'admin_user'), name='unique_department_admin_assignment'),
                ],
            },
        ),
    ]

