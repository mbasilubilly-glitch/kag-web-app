import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_categories(apps, schema_editor):
    GivingCategory = apps.get_model('api', 'GivingCategory')
    Donation = apps.get_model('api', 'Donation')
    MpesaSTKPushRequest = apps.get_model('api', 'MpesaSTKPushRequest')

    names = set()
    names.update(Donation.objects.values_list('category', flat=True))
    names.update(MpesaSTKPushRequest.objects.values_list('category', flat=True))
    # Standard starter set, present even if no existing data uses them yet.
    names.update(['Tithe', 'Offering', 'Sacrifice', 'Thanksgiving', 'Project', 'Others'])
    names.discard('')
    names.discard(None)

    for name in names:
        GivingCategory.objects.get_or_create(name=name)


def populate_category_fk(apps, schema_editor):
    GivingCategory = apps.get_model('api', 'GivingCategory')
    Donation = apps.get_model('api', 'Donation')
    MpesaSTKPushRequest = apps.get_model('api', 'MpesaSTKPushRequest')

    for donation in Donation.objects.all():
        category, _ = GivingCategory.objects.get_or_create(name=donation.category)
        donation.category_new_id = category.id
        donation.save(update_fields=['category_new'])

    for push in MpesaSTKPushRequest.objects.all():
        category, _ = GivingCategory.objects.get_or_create(name=push.category)
        push.category_new_id = category.id
        push.save(update_fields=['category_new'])


def backfill_identifiers(apps, schema_editor):
    Donation = apps.get_model('api', 'Donation')
    for donation in Donation.objects.filter(transaction_id=''):
        donation.transaction_id = f'TXN{uuid.uuid4().hex[:10].upper()}'
        donation.save(update_fields=['transaction_id'])
    for donation in Donation.objects.filter(receipt_number=''):
        donation.receipt_number = f'RCT{uuid.uuid4().hex[:10].upper()}'
        donation.save(update_fields=['receipt_number'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0020_donation_depositor_name_alter_donation_category_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='GivingCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'verbose_name_plural': 'Giving categories', 'ordering': ['name']},
        ),
        migrations.RunPython(seed_categories, noop),

        migrations.AddField(model_name='donation', name='transaction_id', field=models.CharField(blank=True, default='', max_length=30)),
        migrations.AddField(model_name='donation', name='receipt_number', field=models.CharField(blank=True, default='', max_length=30)),
        migrations.AddField(model_name='donation', name='member_id_text', field=models.CharField(blank=True, default='', max_length=30)),
        migrations.RenameField(model_name='donation', old_name='depositor_name', new_name='contributor_name'),
        migrations.AddField(model_name='donation', name='contributor_phone', field=models.CharField(blank=True, default='', max_length=20)),
        migrations.AddField(model_name='donation', name='contributor_email', field=models.EmailField(blank=True, default='', max_length=254)),
        migrations.AddField(model_name='donation', name='remarks', field=models.TextField(blank=True, default='')),
        migrations.AddField(model_name='donation', name='transaction_date', field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name='donation', name='transaction_time', field=models.TimeField(blank=True, null=True)),
        migrations.AddField(
            model_name='donation', name='recorded_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recorded_donations', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='donation', name='status',
            field=models.CharField(choices=[('Successful', 'Successful'), ('Pending', 'Pending'), ('Failed', 'Failed')], default='Successful', max_length=20),
        ),

        migrations.AddField(
            model_name='donation', name='category_new',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='donations_tmp', to='api.givingcategory'),
        ),
        migrations.AddField(
            model_name='mpesastkpushrequest', name='category_new',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='stk_push_requests_tmp', to='api.givingcategory'),
        ),
        migrations.RunPython(populate_category_fk, noop),

        migrations.RemoveField(model_name='donation', name='category'),
        migrations.RemoveField(model_name='mpesastkpushrequest', name='category'),
        migrations.RenameField(model_name='donation', old_name='category_new', new_name='category'),
        migrations.RenameField(model_name='mpesastkpushrequest', old_name='category_new', new_name='category'),

        migrations.AlterField(
            model_name='donation', name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='donations', to='api.givingcategory'),
        ),
        migrations.AlterField(
            model_name='mpesastkpushrequest', name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='stk_push_requests', to='api.givingcategory'),
        ),

        migrations.RunPython(backfill_identifiers, noop),
        migrations.AlterField(model_name='donation', name='transaction_id', field=models.CharField(blank=True, max_length=30, unique=True)),
        migrations.AlterField(model_name='donation', name='receipt_number', field=models.CharField(blank=True, max_length=30, unique=True)),
    ]
