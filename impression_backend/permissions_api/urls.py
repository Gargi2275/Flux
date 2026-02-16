from django.urls import path
from .views import (
    permissions_view,
    permission_detail,
    get_users_by_role,
    update_role_permissions,
    get_user_effective_permissions,
    toggle_user_permission,
    get_role_permissions
)

urlpatterns = [
    # Basic CRUD for Permissions
    path('permissions/', permissions_view, name='permissions_list_create'),
    path('permissions/<int:pk>/', permission_detail, name='permission_detail'),

    # Role-specific
    path('roles/<int:role_id>/users/', get_users_by_role, name='get_users_by_role'),
    
    # Unified update API (assign to roles or specific users)
    path('permissions/assign/', update_role_permissions, name='update_permissions'),

    # Toggle permission for specific users (user-level override)
    path('permissions/toggle/', toggle_user_permission, name='assign_permission_toggle'),

    # Get user's full permission context (from role + overrides)
    path('users/<int:user_id>/effective-permissions/', get_user_effective_permissions, name='get_user_effective_permissions'),
    path('get_role_permissions/<int:role_id>/', get_role_permissions, name='get_role_permissions'),
]
