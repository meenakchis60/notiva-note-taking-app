from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


def fill_share_tokens(apps, schema_editor):
    Note = apps.get_model("notes", "Note")
    for note in Note.objects.all():
        note.share_token = uuid.uuid4()
        note.save(update_fields=["share_token"])


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0002_note_user'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='note',
            name='attachments',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='note',
            name='background_color',
            field=models.CharField(default='#fff8dc', max_length=30),
        ),
        migrations.AddField(
            model_name='note',
            name='checklist',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='note',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='note',
            name='folder_path',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='note',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='is_pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='is_starred',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='note',
            name='reminder_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='note',
            name='share_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False),
        ),
        migrations.AddField(
            model_name='note',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='note',
            name='content',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='note',
            name='notebook',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='note',
            name='subject',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='note',
            name='tags',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.CreateModel(
            name='UserPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme', models.CharField(default='light', max_length=20)),
                ('font_size', models.PositiveIntegerField(default=16)),
                ('autosave_interval', models.PositiveIntegerField(default=30)),
                ('notifications_enabled', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='preferences', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(fill_share_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='note',
            name='share_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
