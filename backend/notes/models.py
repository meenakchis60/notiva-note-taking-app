from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Note(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,
                             null=True)
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    subject = models.CharField(max_length=100, blank=True)
    notebook = models.CharField(max_length=100, blank=True)
    folder_path = models.CharField(max_length=255, blank=True)
    tags = models.CharField(max_length=300, blank=True)
    checklist = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    reminder_at = models.DateTimeField(null=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    background_color = models.CharField(max_length=30, default="#fff8dc")
    share_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    theme = models.CharField(max_length=20, default="light")
    font_size = models.PositiveIntegerField(default=16)
    autosave_interval = models.PositiveIntegerField(default=30)
    notifications_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} preferences"
