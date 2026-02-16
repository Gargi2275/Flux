# permission_api/utils.py

from api.models import Role, RolePermission, Permission

def user_has_permission(user, permission_code):
    if not user.is_authenticated:
        return False

    if user.role == 'superadmin':
        return True  # always allow

    try:
        role = Role.objects.get(role=user.role)
        return RolePermission.objects.filter(role=role, permission__code=permission_code).exists()
    except Role.DoesNotExist:
        return False
