from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.models import Permission,PermissionAssignment,User, Role
from .serializers import PermissionSerializer
from api.serializers import UserSerializer






@api_view(['GET', 'POST'])
def permissions_view(request):
    if request.method == 'GET':
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = PermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET', 'PUT', 'DELETE'])
def permission_detail(request, pk):
    try:
        permission = Permission.objects.get(pk=pk)
    except Permission.DoesNotExist:
        return Response({'error': 'Permission not found'}, status=404)

    if request.method == 'GET':
        serializer = PermissionSerializer(permission)
        return Response(serializer.data)
    
    def is_techadmin(user):
        return user.role == 'techadmin'

    if not is_techadmin(request.user):
        return Response({'error': 'Only techadmin can edit/delete permissions'}, status=403)

    try:
        permission = Permission.objects.get(pk=pk)
    except Permission.DoesNotExist:
        return Response({'error': 'Permission not found'}, status=404)

    if request.method == 'PUT':
        serializer = PermissionSerializer(permission, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        permission.delete()
        return Response({'message': 'Permission deleted'}, status=204)
    

@api_view(['GET'])
def get_user_effective_permissions(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    # Fetch ALL user-specific permission assignments (allow=True and allow=False)
    user_assignments = PermissionAssignment.objects.filter(
        user=user
    )

    # permission_id -> {id, allow}
    user_permission_map = {
        pa.permission_id: {
            'id': pa.id,
            'allow': pa.allow
        }
        for pa in user_assignments
    }

    # Role-based permissions (only allow=True and not user-specific)
    role_permissions = []
    if user.role:
        role_permissions = Permission.objects.filter(
            permissionassignment__role__role=user.role,
            permissionassignment__user__isnull=True,
            permissionassignment__allow=True
        ).values_list('id', flat=True)

    # Compute final effective permissions
    effective_permissions = set(role_permissions)
    for perm_id, info in user_permission_map.items():
        if info['allow']:
            effective_permissions.add(perm_id)
        else:
            effective_permissions.discard(perm_id)  # explicitly denied by user

    return Response({
        "user_permissions": user_permission_map,  # permission_id -> {id, allow}
        "role_permissions": list(role_permissions),
        "effective_permissions": list(effective_permissions)
    })




@api_view(['POST'])
def update_role_permissions(request):
    role_id = request.data.get("role_id")
    permission_ids = request.data.get("permission_ids", [])
    assign_to_all = request.data.get("assign_to_all_role_users", True)

    if not role_id:
        return Response({"error": "Role ID is required"}, status=400)

    try:
        role = Role.objects.get(pk=role_id)
    except Role.DoesNotExist:
        return Response({"error": "Role not found"}, status=404)

    if assign_to_all:
        # Add or remove permission assignments for all users in the role
        for permission_id in permission_ids:
            permission_assignment, created = PermissionAssignment.objects.get_or_create(
                role=role, permission_id=permission_id, user=None
            )
            if not created:  # If it exists, delete it (uncheck)
                permission_assignment.delete()
    else:
        # Handle individual user permission assignments, if necessary
        pass

    return Response({"message": "Permissions updated successfully"})

from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import Role, User, PermissionAssignment  # Adjust if needed

def has_permission(user, permission_id):
    """
    Check if a user has the specified permission either by:
    - Explicit user-level override (granted or denied), or
    - Role-level assignment (if no override exists)
    """
    user_override = PermissionAssignment.objects.filter(user=user, permission_id=permission_id).first()
    
    if user_override:
        return user_override.allow  # True = grant, False = deny
    
    return PermissionAssignment.objects.filter(role=user.role, permission_id=permission_id).exists()



@api_view(['POST'])
def toggle_user_permission(request):
    """
    Toggle a specific permission for multiple users within a role.
    Only users whose roles match the provided role_id will be affected.
    """
    role_id = request.data.get('role_id')
    user_ids = request.data.get('user_ids', [])
    permission_id = request.data.get('permission_id')
    allow = request.data.get('allow')  # This should be a boolean value (True/False)

    if not role_id or not user_ids or not permission_id or allow is None:
        return Response({'error': 'Missing required fields'}, status=400)

    try:
        role = Role.objects.get(pk=role_id)
    except Role.DoesNotExist:
        return Response({'error': 'Role not found'}, status=404)

    messages = []

    for user_id in user_ids:
        try:
            user = User.objects.get(pk=user_id)

            # Ensure the user's role matches the provided role
            if user.role != role.role:
                messages.append(f'User {user.username} skipped: role mismatch.')
                continue

            # Check if the permission already exists for this user
            permission_assignment = PermissionAssignment.objects.filter(user=user, permission_id=permission_id)

            if allow:  # If allow is True, grant permission (create or update)
                if permission_assignment.exists():
                    # Update the existing entry to ensure the permission is granted
                    permission_assignment.update(allow=True)
                    messages.append(f'Granted user-level permission to {user.username}.')
                else:
                    # Create a new entry for the permission
                    PermissionAssignment.objects.create(user=user, permission_id=permission_id, allow=True)
                    messages.append(f'Granted user-level permission to {user.username}.')
            else:  # If allow is False, disable the permission (set allow=0)
                if permission_assignment.exists():
                    # Update the existing entry to 'disallowed' (0)
                    permission_assignment.update(allow=False)
                    messages.append(f'Disabled user-level permission for {user.username}.')
                else:
                    # If the permission assignment does not exist, create a new one with allow=False
                    PermissionAssignment.objects.create(user=user, permission_id=permission_id, allow=False)
                    messages.append(f'Created user-level permission entry (disabled) for {user.username}.')

        except User.DoesNotExist:
            messages.append(f'User with ID {user_id} not found.')
            continue

    return Response({
        'message': 'User permissions updated.',
        'details': messages
    }, status=200)






@api_view(['GET'])
def get_role_permissions(request, role_id):
    try:
        role = Role.objects.get(pk=role_id)
    except Role.DoesNotExist:
        return Response({'error': 'Role not found'}, status=404)

    # Fetch the permission assignments for this role
    permission_assignments = PermissionAssignment.objects.filter(
        role=role,
        user__isnull=True
    )

    permission_ids = list(
        PermissionAssignment.objects.filter(
            role=role,
            user__isnull=True
        ).values_list('permission_id', flat=True)
    )

    return Response({'assigned_permissions': permission_ids})


@api_view(['GET'])
def get_users_by_role(request, role_id):
    try:
        role = Role.objects.get(pk=role_id)
    except Role.DoesNotExist:
        return Response({'error': 'Role not found'}, status=404)

    users = User.objects.filter(role=role.role)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

