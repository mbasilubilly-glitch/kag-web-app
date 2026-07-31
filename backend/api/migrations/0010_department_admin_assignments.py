# This migration file is intentionally disabled.
# Django requires each migration file to define a Migration class.
# Because 0010_department_admin_assignments conflicted with 0011, we make 0010 an empty valid migration
# so Django can continue to load migrations normally.

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0009_roleauditlog'),
    ]

    operations = []

