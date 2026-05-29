from django.contrib.auth.models import User
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Note, UserPreference
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes


def note_to_dict(note):
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "subject": note.subject,
        "notebook": note.notebook,
        "folder_path": note.folder_path,
        "tags": note.tags,
        "tag_list": [tag.strip() for tag in note.tags.split(",") if tag.strip()],
        "checklist": note.checklist,
        "attachments": note.attachments,
        "reminder_at": note.reminder_at.isoformat() if note.reminder_at else "",
        "is_pinned": note.is_pinned,
        "is_starred": note.is_starred,
        "is_deleted": note.is_deleted,
        "background_color": note.background_color,
        "share_url": f"/shared/{note.share_token}/",
        "created_at": note.created_at.isoformat(),
        "updated_at": note.updated_at.isoformat(),
    }


def preference_to_dict(preferences):
    return {
        "theme": preferences.theme,
        "font_size": preferences.font_size,
        "autosave_interval": preferences.autosave_interval,
        "notifications_enabled": preferences.notifications_enabled,
    }


@api_view(['POST'])
def register_user(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"message": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"message": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    UserPreference.objects.get_or_create(user=user)
    return Response({"message": "Account created successfully."}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_api(request):
    notes = Note.objects.filter(user=request.user, is_deleted=False)
    return Response([note_to_dict(note) for note in notes])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def filter_notes(request):
    subject = request.GET.get('subject', '').strip()
    notebook = request.GET.get('notebook', '').strip()
    tag = request.GET.get('tag', '').strip()
    search = request.GET.get('search', '').strip()
    starred = request.GET.get('starred', '').strip()

    notes = Note.objects.filter(user=request.user, is_deleted=False)

    if request.GET.get("trash") == "true":
        notes = Note.objects.filter(user=request.user, is_deleted=True)

    if search:
        notes = notes.filter(Q(title__icontains=search) | Q(content__icontains=search) | Q(tags__icontains=search))
    if starred == "true":
        notes = notes.filter(is_starred=True)

    def with_filters(queryset, include_subject=True, include_notebook=True, include_tag=True):
        if include_subject and subject:
            queryset = queryset.filter(subject__iexact=subject)
        if include_notebook and notebook:
            queryset = queryset.filter(notebook__iexact=notebook)
        if include_tag and tag:
            queryset = queryset.filter(tags__icontains=tag)
        return queryset

    subject_notes = with_filters(notes, include_subject=False)
    notebook_notes = with_filters(notes, include_notebook=False)
    tag_notes = with_filters(notes, include_tag=False)
    folder_notes = with_filters(notes)

    notebooks = sorted({note.notebook for note in notebook_notes if note.notebook})
    tags = sorted({
        tag.strip()
        for note in tag_notes
        for tag in note.tags.split(",")
        if tag.strip()
    })
    subjects = sorted({note.subject for note in subject_notes if note.subject})
    folders = sorted({note.folder_path for note in folder_notes if note.folder_path})

    return Response({"subjects": subjects, "notebooks": notebooks, "folders": folders, "tags": tags})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_notes(request):
    if request.method == 'POST':
        reminder_at = parse_datetime(request.data.get("reminder_at") or "")
        note = Note.objects.create(
            user=request.user,
            title=request.data.get('title', 'Untitled Note'),
            content=request.data.get('content', ''),
            subject=request.data.get('subject', ''),
            notebook=request.data.get('notebook', ''),
            folder_path=request.data.get('folder_path', ''),
            tags=request.data.get('tags', ''),
            checklist=request.data.get('checklist', []),
            attachments=request.data.get('attachments', []),
            reminder_at=reminder_at,
            is_pinned=bool(request.data.get('is_pinned', False)),
            is_starred=bool(request.data.get('is_starred', False)),
            background_color=request.data.get('background_color', '#fff8dc'),
        )
        return Response(note_to_dict(note), status=status.HTTP_201_CREATED)

    notes = Note.objects.filter(user=request.user)

    if request.GET.get("trash") != "true":
        notes = notes.filter(is_deleted=False)
    else:
        notes = notes.filter(is_deleted=True)

    search = request.GET.get("search", "").strip()
    subject = request.GET.get("subject", "").strip()
    notebook = request.GET.get("notebook", "").strip()
    tag = request.GET.get("tag", "").strip()
    starred = request.GET.get("starred", "").strip()

    if search:
        notes = notes.filter(Q(title__icontains=search) | Q(content__icontains=search) | Q(tags__icontains=search))
    if subject:
        notes = notes.filter(subject__iexact=subject)
    if notebook:
        notes = notes.filter(notebook__iexact=notebook)
    if tag:
        notes = notes.filter(tags__icontains=tag)
    if starred == "true":
        notes = notes.filter(is_starred=True)

    notes = notes.order_by("-is_pinned", "-updated_at")
    return Response([note_to_dict(note) for note in notes])


@api_view(['DELETE', 'PUT'])
@permission_classes([IsAuthenticated])
def delete_note(request,id):
    note = get_object_or_404(Note, id=id, user=request.user)

    if request.method == 'PUT':
        note.title = request.data.get('title', note.title)
        note.content = request.data.get('content', note.content)
        note.subject = request.data.get('subject', note.subject)
        note.notebook = request.data.get('notebook', note.notebook)
        note.folder_path = request.data.get('folder_path', note.folder_path)
        note.tags = request.data.get('tags', note.tags)
        note.checklist = request.data.get('checklist', note.checklist)
        note.attachments = request.data.get('attachments', note.attachments)
        note.reminder_at = parse_datetime(request.data.get("reminder_at") or "") if "reminder_at" in request.data else note.reminder_at
        note.is_pinned = bool(request.data.get('is_pinned', note.is_pinned))
        note.is_starred = bool(request.data.get('is_starred', note.is_starred))
        note.background_color = request.data.get('background_color', note.background_color)
        note.save()
        return Response(note_to_dict(note))

    note.soft_delete()
    return Response({"message":"Moved to trash"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_note(request, id):
    note = get_object_or_404(Note, id=id, user=request.user)
    note.is_deleted = False
    note.deleted_at = None
    note.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
    return Response(note_to_dict(note))


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def permanent_delete_note(request, id):
    note = get_object_or_404(Note, id=id, user=request.user, is_deleted=True)
    note.delete()
    return Response({"message": "Deleted permanently"})


@api_view(['GET'])
def shared_note(request, token):
    note = get_object_or_404(Note, share_token=token, is_deleted=False)
    return Response(note_to_dict(note))


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def preferences(request):
    prefs, _ = UserPreference.objects.get_or_create(user=request.user)

    if request.method == 'PUT':
        prefs.theme = request.data.get("theme", prefs.theme)
        prefs.font_size = int(request.data.get("font_size", prefs.font_size))
        prefs.autosave_interval = int(request.data.get("autosave_interval", prefs.autosave_interval))
        prefs.notifications_enabled = bool(request.data.get("notifications_enabled", prefs.notifications_enabled))
        prefs.save()

    return Response(preference_to_dict(prefs))
