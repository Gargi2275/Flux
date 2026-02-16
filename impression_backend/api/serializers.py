# serializers.py
from rest_framework import serializers
from .models import Role, User,Warehouse, Product,ProductWarehouse, UserWarehouse

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role', 'created_at', 'updated_at']

    def validate_role(self, value):
        request = self.context.get('request')  # Get the user from context
        trimmed = value.strip()
        normalized = trimmed.lower().replace(" ", "")

        # Check for superadmin role restriction
        if normalized == "superadmin":
            # Only allow techadmin to create it
            if not request or request.user.role.lower() != "techadmin":
                raise serializers.ValidationError("Only 'techadmin' can create a 'superadmin' role.")

        # Block duplicate roles (case-insensitive)
        if Role.objects.filter(role__iexact=trimmed).exists():
            raise serializers.ValidationError("Role already exists.")

        return trimmed


import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserWarehouse, Role, Company

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    warehouses = serializers.SerializerMethodField()
    role_id = serializers.SerializerMethodField()
    companies = serializers.PrimaryKeyRelatedField(many=True, queryset=Company.objects.all(), required=False)  # Added

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'password',
            'role', 'created_at', 'updated_at', 'warehouses', 'role_id', 'companies'
        ]

    def validate_username(self, value):
        if ' ' in value:
            raise serializers.ValidationError("Username must not contain spaces.")
        return value

    def validate(self, data):
        password = data.get('password')
        if password:
            if len(password) < 8:
                raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                raise serializers.ValidationError({"password": "Password must contain at least one special character."})
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        companies = validated_data.pop('companies', None)  # Added
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if companies is not None:
            instance.companies.set(companies)  # Added
        return instance

    def create(self, validated_data):
            password = validated_data.pop('password')
            companies = validated_data.pop('companies', [])
            request = self.context.get('request')  # Get current request
            created_by = request.user if request else None

            user = User(**validated_data)
            user.set_password(password)
            if created_by:
                user.created_by = created_by
            user.save()
            if companies:
                user.companies.set(companies)
            return user


    def get_warehouses(self, obj):
        return list(UserWarehouse.objects.filter(user=obj).values_list('warehouse_id', flat=True))

    def get_role_id(self, obj):
        try:
            role_obj = Role.objects.get(role__iexact=obj.role.strip())
            return role_obj.id
        except Role.DoesNotExist:
            return None





from rest_framework import serializers
from .models import ShowPrevDateSetting
class ShowPrevDateSettingSerializer(serializers.ModelSerializer):
    show = serializers.BooleanField()

    class Meta:
        model = ShowPrevDateSetting
        fields = ['id', 'name', 'show']



from rest_framework import serializers
from .models import Warehouse

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'code', 'description', 'created_at', 'updated_at','company_id']

    def validate_name(self, value):
        request = self.context.get('request')
        user = request.user if request else None

        if not user or not hasattr(user, 'companies') or not user.companies.exists():
            raise serializers.ValidationError("User must belong to a company to validate warehouse name.")

        company = user.companies.first()

        queryset = Warehouse.objects.filter(name__iexact=value, company=company)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Warehouse name must be unique within your company.")
        return value




# serializers.py

class ProductSerializer(serializers.ModelSerializer):
    warehouses = serializers.ListField(write_only=True, required=False)
    company_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Product
        fields = ['id', 'product_name', 'warehouses', 'company_id']

    def create(self, validated_data):
        warehouses = validated_data.pop('warehouses', [])
        company_id = validated_data.pop('company_id', None)

        if not company_id:
            raise serializers.ValidationError("company_id must be provided.")

        user = self.context.get('user')
        if not user:
            raise serializers.ValidationError("User must be provided in context.")

        product = Product.objects.create(
            company_id=company_id,
            created_by=user,
            **validated_data
        )

        for warehouse_id in warehouses:
            if warehouse_id:
                ProductWarehouse.objects.get_or_create(product=product, warehouse_id=warehouse_id)

        return product

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add warehouses as list of IDs
        representation['warehouses'] = [w.id for w in instance.warehouses.all()]
        # Add company_id explicitly
        representation['company_id'] = instance.company_id
        return representation



class UserWarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWarehouse
        fields = ['id', 'user', 'warehouse', 'created_at', 'updated_at']


from rest_framework import serializers
from .models import ProductStock

class ProductStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductStock
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    remove_logo = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Company
        fields = '__all__'

    def create(self, validated_data):
        validated_data.pop('remove_logo', None)  # Remove if present
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.pop('remove_logo', False):
            if instance.logo:
                instance.logo.delete(save=False)
            instance.logo = None
        return super().update(instance, validated_data)


from rest_framework import serializers
from .models import SavedReport

class SavedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedReport
        fields = '__all__'
