from rest_framework import serializers
from api.models import Permission, Role, PermissionAssignment, User


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class PermissionAssignmentSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    permission = serializers.PrimaryKeyRelatedField(queryset=Permission.objects.all())

    class Meta:
        model = PermissionAssignment
        fields = ['id', 'user', 'role', 'permission']
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=PermissionAssignment.objects.all(),
                fields=['user', 'role', 'permission'],
                message="This permission assignment already exists."
            )
        ]
