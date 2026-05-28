from django.urls import path
from .views import (
    delete_note,
    filter_notes,
    get_notes,
    permanent_delete_note,
    preferences,
    register_user,
    restore_note,
    shared_note,
    test_api,
)

urlpatterns = [
    path('register/', register_user),
    path('test/', test_api),
    path('filter/', filter_notes),
    path('notes/', get_notes),
    path('notes/<int:id>/', delete_note),
    path('notes/<int:id>/restore/', restore_note),
    path('notes/<int:id>/permanent-delete/', permanent_delete_note),
    path('preferences/', preferences),
    path('shared/<uuid:token>/', shared_note),
]
