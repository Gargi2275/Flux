# permission_api/permissions.py

from rest_framework.permissions import BasePermission
from api.models import Role, RolePermission, Permission

class HasAPILevelPermission(BasePermission):
    def has_permission(self, request, view):
        required_permission = getattr(request, 'required_permission', None)

        if not required_permission:
            return False  # No permission code attached to this view

        user = request.user
        if not user.is_authenticated:
            return False

        if user.role == 'superadmin':
            return True

        try:
            role_obj = Role.objects.get(role=user.role)
        except Role.DoesNotExist:
            return False

        allowed_permissions = RolePermission.objects.filter(role=role_obj).select_related('permission')
        allowed_codes = [p.permission.code for p in allowed_permissions]

        return required_permission in allowed_codes
