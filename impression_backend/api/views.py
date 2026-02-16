# views.py
from rest_framework import generics
from .models import Role, User
from .serializers import RoleSerializer, UserSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .models import User ,ProductWarehouse # Import your User model
from .serializers import UserSerializer  # Your serializer for the User model
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import Warehouse, Product, UserWarehouse
from .serializers import WarehouseSerializer,ProductSerializer
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
import json
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from datetime import datetime
from django.db import connection
from rest_framework import serializers
from .models import Role,Product

from rest_framework.permissions import BasePermission

class CanViewRoles(BasePermission):
    """
    Custom permission to check if the user can view roles.
    """

    def has_permission(self, request, view):
        # You can use your own logic to check if the user has permission to view roles
        user = request.user

        # You can either hardcode the logic or use a permission model to check if the user has the permission
    
        if user.role == 'techadmin':  # Example: Techadmin can view roles except 'techadmin' itself
            # You can check for more conditions based on your needs
            return True
        return False  # Deny permission by default




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_logged_in_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# permission_api/views.py

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import Role
from .serializers import RoleSerializer

from rest_framework.response import Response
from rest_framework import generics
from .serializers import RoleSerializer
from .models import Role
from .views import CanViewRoles  # Import the custom permission
from rest_framework import generics, permissions
from .models import Role, PermissionAssignment
from .serializers import RoleSerializer
from .views import CanViewRoles  # your custom permission
from django.db.models import Q


from django.db.models import Q
from rest_framework import permissions, generics
from api.models import Role, PermissionAssignment
from api.serializers import RoleSerializer

from django.db.models import Q
from rest_framework import generics, permissions
from .models import Role, PermissionAssignment,Permission
from .serializers import RoleSerializer

class RoleListView(generics.ListAPIView):
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_role = (user.role or "").strip().lower()

        queryset = Role.objects.all()

        # ✅ Allow full access (except techadmin) for techadmin
        if user_role == "techadmin":
            return queryset.exclude(role__iexact="techadmin")

        # ✅ Step 1: User-specific permission overrides
        user_assignments = PermissionAssignment.objects.filter(user=user)
        user_permission_map = {pa.permission_id: pa.allow for pa in user_assignments}

        # ✅ Step 2: Role-based permissions (only allow=True, no user override)
        role_permission_ids = []
        if user.role:
            role_permission_ids = Permission.objects.filter(
                permissionassignment__role__role__iexact=user.role,
                permissionassignment__user__isnull=True,
                permissionassignment__allow=True
            ).values_list('id', flat=True)

        # ✅ Step 3: Compute effective permissions
        effective_permission_ids = set(role_permission_ids)
        for perm_id, allow in user_permission_map.items():
            if allow:
                effective_permission_ids.add(perm_id)
            else:
                effective_permission_ids.discard(perm_id)  # denied overrides allowed

        # ✅ Step 4: Filter for create_* permissions
        permission_codes = Permission.objects.filter(id__in=effective_permission_ids).values_list("code", flat=True)
        create_permission_codes = [code for code in permission_codes if code.startswith("create_")]
        role_names = [code.replace("create_", "").lower() for code in create_permission_codes]

        # ✅ Step 5: Return filtered roles
        if not role_names:
            return Role.objects.none()

        return queryset.filter(role__in=role_names)



class RoleCreateView(generics.CreateAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        role_to_create = request.data.get("role", "").strip().lower().replace(" ", "")
        user_role = request.user.role.lower() if request.user.role else ""

        # Prevent creating own role type
        if (user_role == "techadmin" and role_to_create == "techadmin") or \
           (user_role == "superadmin" and role_to_create in ["superadmin", "techadmin"]):
            return Response(
                {"detail": f"{user_role} is not allowed to create {role_to_create}."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check for duplicate role
        if Role.objects.filter(role__iexact=role_to_create).exists():
            return Response(
                {"role": "Role already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)


class RoleUpdateView(generics.UpdateAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Restrict editing superadmin role to techadmin only
        if instance.role.lower() == "superadmin" and request.user.role.lower() != "techadmin":
            return Response({"detail": "Only techadmin can update superadmin role."}, status=status.HTTP_403_FORBIDDEN)

        return super().update(request, *args, **kwargs)

class RoleDeleteView(generics.DestroyAPIView):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Restrict deleting superadmin role to techadmin only
        if instance.role.lower() == "superadmin" and request.user.role.lower() != "techadmin":
            return Response({"detail": "Only techadmin can delete superadmin role."}, status=status.HTTP_403_FORBIDDEN)

        return super().destroy(request, *args, **kwargs)

    
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from .models import User

def is_superadmin(user):
    return user.role in ['superadmin', 'techadmin']


from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer

def is_user_role(user):
    return user.role == 'user'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    # Check if the requesting user has the 'user' role
    if is_user_role(request.user):
        return Response(
            {'message': 'Users cannot create other users', 'type': 'error'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if the requesting user is trying to assign their own role to a new user
    requested_role = request.data.get('role')
    if requested_role == request.user.role:
        return Response(
            {'message': 'You cannot assign a user the same role as your own', 'type': 'error'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if the username already exists
    username = request.data.get('username')
    if User.objects.filter(username=username).exists():
        return Response(
            {'message': 'Username already exists', 'type': 'error'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Proceed with user creation if the above checks are passed
    serializer = UserSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        if request.user.role.lower() == 'admin':
            user.companies.set(request.user.companies.all())
        user.created_by = request.user  # <<== KEY LINE
        user.save()


        # Return response with the updated user data
        updated_serializer = UserSerializer(user)
        return Response(
            {'message': 'User successfully created', 'type': 'success', 'data': updated_serializer.data},
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        {'message': 'Invalid data', 'type': 'error', 'errors': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, user_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Only superadmin can view users'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
from rest_framework.exceptions import ValidationError

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Only superadmin can edit users'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id)
        
        # Check if the username already exists and is not the same as the current user's username
        username = request.data.get('username')
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            raise ValidationError({"username": "User with this username already exists."})

        # Proceed with serialization and saving the user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except ValidationError as e:
        return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    
    
    
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    if not is_superadmin(request.user):
        return Response({'error': 'Only superadmin can delete users'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({'message': 'User deleted successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import base64

@api_view(['POST'])
def login_user(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION')

    if not auth_header or not auth_header.startswith('Basic '):
        return Response({'error': 'Missing or invalid Authorization header'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Decode base64 string
        encoded_credentials = auth_header.split(' ')[1]
        decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
        username, password = decoded_credentials.split(':', 1)
    except Exception:
        return Response({'error': 'Invalid Authorization header format'}, status=status.HTTP_400_BAD_REQUEST)

    # Authenticate user
    user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        serializer = UserSerializer(user)
        return Response({
            'token': token.key,
            'role': serializer.data.get('role')
        })


    try:
        User.objects.get(username=username)
        return Response({'error': 'Incorrect password'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'Incorrect username'}, status=status.HTTP_401_UNAUTHORIZED)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        # Delete the token for the authenticated user
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()

class UserListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        role = current_user.role.lower()

        # Base queryset with role-based exclusions
        if role == 'techadmin':
            users = User.objects.exclude(role__iexact='techadmin')
            
            
        elif role == 'superadmin':
            users = User.objects.exclude(role__in=['techadmin', 'superadmin']).filter(created_by=current_user)

            company_id = request.query_params.get('company_id')
            if company_id:
                users = users.filter(companies__id=company_id)

            users = users.distinct()

                
        elif role == 'admin':
            # Get companies assigned to current admin user
            company_ids = current_user.companies.values_list('id', flat=True)

            # Filter users:
            # - Exclude users with roles 'superadmin', 'techadmin', and 'admin' (other admins)
            # - Include only users assigned to current admin's companies
            users = User.objects.filter(
        companies__id__in=company_ids,
        created_by=current_user  # <<== KEY LINE
    ).exclude(
        role__in=['superadmin', 'techadmin', 'admin']
    ).distinct()

  
        else:
            users = User.objects.exclude(role__in=['techadmin', 'superadmin'])

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_warehouse(request):
    user = request.user

    warehouse_name = request.data.get('name')
    warehouse_code = request.data.get('code', '')
    description = request.data.get('description')
    company_id = request.data.get('company_id')

    if not warehouse_name or not description:
        return Response({"error": "Both 'name' and 'description' are required."}, status=400)

    if not company_id:
        return Response({"error": "Company ID is required."}, status=400)

    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({"error": "Invalid company ID."}, status=400)

    # Ensure user belongs to this company
    if not user.companies.filter(pk=company.pk).exists():
        return Response({"error": "You do not belong to the selected company."}, status=403)

    # Check warehouse name uniqueness per company (not per user)
    if Warehouse.objects.filter(name=warehouse_name, company=company).exists():
        return Response({"error": "A warehouse with this name already exists for this company."}, status=400)

    try:
        warehouse = Warehouse.objects.create(
            name=warehouse_name,
            code=warehouse_code or None,
            description=description,
            company=company,
            created_by=user
        )
        return Response(WarehouseSerializer(warehouse).data, status=201)

    except IntegrityError:
        return Response({"error": "Failed to create warehouse due to integrity error."}, status=400)

 
      
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_warehouse(request, pk):
    try:
        warehouse = Warehouse.objects.get(pk=pk)
    except Warehouse.DoesNotExist:
        return Response({'error': 'Warehouse not found'}, status=404)

    serializer = WarehouseSerializer(
        warehouse,
        data=request.data,
        context={'request': request}  # <-- This is important!
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
def delete_warehouse(request, pk):
    try:
        warehouse = Warehouse.objects.get(pk=pk)
        warehouse.delete()
        return Response({"message": "Warehouse deleted"}, status=200)
    except Warehouse.DoesNotExist:
        return Response({"error": "Warehouse not found"}, status=404)




def get_warehouse_by_id(request, id):
    try:
        warehouse = Warehouse.objects.get(id=id)
        data = {
            "id": warehouse.id,
            "name": warehouse.name,
            "code": warehouse.code,
            "description": warehouse.description,
        }
        return JsonResponse(data)
    except Warehouse.DoesNotExist:
        return JsonResponse({'error': 'Warehouse not found'}, status=404)

    

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Warehouse
from .serializers import WarehouseSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def warehouse_list(request):
    user = request.user
    company_id = request.GET.get('company_id')

    if user.role == 'User':
        warehouses = Warehouse.objects.filter(userwarehouse__user=user)

    elif user.role in ['admin', 'superadmin']:
        if company_id:
            warehouses = Warehouse.objects.filter(company__id=company_id, created_by=user)
        else:
            company = user.companies.first()
            if company:
                warehouses = Warehouse.objects.filter(company=company, created_by=user)
            else:
                warehouses = Warehouse.objects.none()
    else:
        warehouses = Warehouse.objects.none()

    serializer = WarehouseSerializer(warehouses, many=True, context={'request': request})
    return Response(serializer.data)







from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Warehouse, UserWarehouse  # adjust if using related name
from .serializers import WarehouseSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_warehouses(request):
    user = request.user
    if user.role == 'User':
        warehouses = Warehouse.objects.filter(userwarehouse__user=user)
    else:
        warehouses = Warehouse.objects.all()
    
    serializer = WarehouseSerializer(warehouses, many=True)
    return Response(serializer.data)



from django.contrib.auth import get_user_model

def get_all_descendant_users(user):
    """
    Returns a list of all users created by the given user (recursively), including the user.
    Also prints the list of descendant users for debugging.
    """
    User = get_user_model()
    all_related_users = set()
    to_process = [user]

    while to_process:
        current = to_process.pop()
        if current not in all_related_users:
            all_related_users.add(current)
            children = User.objects.filter(created_by=current)
            to_process.extend(children)

    descendant_list = list(all_related_users)
    print(f"[DEBUG] Descendant users of '{user.username}': {[u.username for u in descendant_list]}")
    return descendant_list



@permission_classes([IsAuthenticated])
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        user = self.request.user
        user_companies = user.companies.all()
        company_id = self.request.query_params.get('company_id')

        try:
            company_id = int(company_id) if company_id is not None else None
        except ValueError:
            return Product.objects.none()

        visible_users = get_all_descendant_users(user)

        if company_id:
            if user_companies.filter(id=company_id).exists():
                queryset = Product.objects.filter(
                    company_id=company_id,
                    created_by__in=visible_users
                ).order_by('-created_at')
            else:
                queryset = Product.objects.none()
        else:
            queryset = Product.objects.filter(
                company__in=user_companies,
                created_by__in=visible_users
            ).order_by('-created_at')

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        company = user.companies.first()
        serializer.save(company=company, created_by=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_products(request):
    user = request.user
    company_id = request.query_params.get('company_id')
    warehouse_id = request.query_params.get('warehouse_id')

    user_companies = user.companies.all()
    visible_users = get_all_descendant_users(user)

    try:
        company_id = int(company_id) if company_id is not None else None
    except ValueError:
        return Response({'error': 'Invalid company_id'}, status=400)

    products = Product.objects.filter(
        company__in=user_companies,
        created_by__in=visible_users
    )

    if company_id and user_companies.filter(id=company_id).exists():
        products = products.filter(company_id=company_id)
    elif company_id:
        return Response({'error': 'Unauthorized company_id'}, status=403)

    if warehouse_id:
        try:
            warehouse_id = int(warehouse_id)
            products = products.filter(warehouses__id=warehouse_id).distinct()
        except ValueError:
            return Response({'error': 'Invalid warehouse_id'}, status=400)

    products = products.order_by('-created_at')

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product(request):
    company_id = request.data.get('company_id')
    product_name = request.data.get('product_name')

    if not company_id:
        return Response({'company_id': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

    # Check that the user belongs to the given company
    if not request.user.companies.filter(id=company_id).exists():
        return Response({'message': 'You do not belong to this company.'}, status=status.HTTP_403_FORBIDDEN)

    # Check uniqueness within company
    if Product.objects.filter(product_name=product_name, company_id=company_id).exists():
        return Response({'message': 'Product already exists in your company'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ProductSerializer(data=request.data, context={'user': request.user})

    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Product created successfully'}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_product(request, pk):
    company_ids = request.user.companies.values_list('id', flat=True)

    try:
        product = Product.objects.get(id=pk, company__id__in=company_ids)
    except Product.DoesNotExist:
        return Response({'message': 'Product not found or not in your company'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductSerializer(product, data=request.data, partial=True, context={'company': product.company, 'user': request.user})

    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Product updated successfully'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Product

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Product

from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import authentication_classes

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Product


# views.py

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        product.delete()
        return Response({'message': 'Product deleted successfully'}, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_products_bulk(request):
    ids_param = request.query_params.get('ids')
    if not ids_param:
        return Response({'error': 'No product IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ids = [int(i) for i in ids_param.split(',')]
        products = Product.objects.filter(id__in=ids)
        count = products.count()

        if count == 0:
            return Response({'message': 'No products found for deletion'}, status=status.HTTP_404_NOT_FOUND)

        products.delete()
        return Response({'message': f'{count} product(s) deleted successfully'}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def update_product_warehouse(request):
    product_id = request.data.get('product_id')
    warehouse_id = request.data.get('warehouse_id')
    action = request.data.get('action', '').lower()

    if not product_id or not warehouse_id:
        return Response({"status": "error", "message": "Missing product_id or warehouse_id"})

    try:
        product = Product.objects.get(id=product_id)
        warehouse = Warehouse.objects.get(id=warehouse_id)
    except Product.DoesNotExist:
        return Response({"status": "error", "message": "Product not found"})
    except Warehouse.DoesNotExist:
        return Response({"status": "error", "message": "Warehouse not found"})

    if action == "add":
        try:
            ProductWarehouse.objects.create(product=product, warehouse=warehouse)
            return Response({"status": "success", "message": "Product linked to warehouse"})
        except IntegrityError:
            return Response({"status": "error", "message": "This product is already linked to this warehouse"})

    elif action == "remove":
        deleted, _ = ProductWarehouse.objects.filter(product=product, warehouse=warehouse).delete()
        if deleted:
            return Response({"status": "success", "message": "Product unlinked from warehouse"})
        else:
            return Response({"status": "error", "message": "No matching link found"})

    else:
        return Response({"status": "error", "message": "Invalid action"})
    


User = get_user_model()

@api_view(['POST'])
def update_user_warehouse(request):
    user_id = request.data.get('user_id')
    warehouse_id = request.data.get('warehouse_id')
    action = request.data.get('action', '').lower()

    if not user_id or not warehouse_id:
        return Response({"status": "error", "message": "Missing user_id or warehouse_id"})

    try:
        user = User.objects.get(id=user_id, role='User')  # Restrict only to 'User' role
        warehouse = Warehouse.objects.get(id=warehouse_id)
    except User.DoesNotExist:
        return Response({"status": "error", "message": "User not found or not allowed"})
    except Warehouse.DoesNotExist:
        return Response({"status": "error", "message": "Warehouse not found"})

    if action == "add":
        try:
            UserWarehouse.objects.create(user=user, warehouse=warehouse)
            return Response({"status": "success", "message": "User linked to warehouse"})
        except IntegrityError:
            return Response({"status": "error", "message": "This user is already linked to this warehouse"})

    elif action == "remove":
        deleted, _ = UserWarehouse.objects.filter(user=user, warehouse=warehouse).delete()
        if deleted:
            return Response({"status": "success", "message": "User unlinked from warehouse"})
        else:
            return Response({"status": "error", "message": "No matching link found"})

    else:
        return Response({"status": "error", "message": "Invalid action"})
    
from django.http import JsonResponse
from django.db import connection
from rest_framework.decorators import api_view
from .models import Product
from datetime import datetime

def add_dynamic_column(date_str):
    column_name = f'quantity_{date_str}'
    with connection.cursor() as cursor:
        try:
            cursor.execute(f'''
                ALTER TABLE `Product`
                ADD COLUMN `{column_name}` INTEGER DEFAULT 0;
            ''')
            print(f"✅ Column `{column_name}` added.")
        except Exception as e:
            print(f"⚠️ Column might already exist or failed: {e}")



def update_dynamic_quantity(product_name, date_str, quantity, company_id):
    # Normalize quantity: convert to int safely
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        quantity = 0

    column_name = f'quantity_{date_str}'  # e.g. quantity_2025-04-19

    with connection.cursor() as cursor:
        # Step 1: Fetch current value
        cursor.execute(f'''
            SELECT `{column_name}` FROM `Product`
            WHERE product_name = %s AND company_id = %s;
        ''', [product_name, company_id])
        result = cursor.fetchone()
        current_value = result[0] if result else None

        print(f"▶️ {product_name} (company {company_id}): current = {current_value}, incoming = {quantity}")

        # Step 2: Compare and update if value changed
        if current_value != quantity:
            cursor.execute(f'''
                UPDATE `Product`
                SET `{column_name}` = %s, updated_at = NOW()
                WHERE product_name = %s AND company_id = %s;
            ''', [quantity, product_name, company_id])
            print(f"✅ Updated `{product_name}` → {column_name} = {quantity} for company {company_id}")
            return True

    return False



def check_column_exists(date_str):
    column_name = f'quantity_{date_str.replace("-", "-")}'
    with connection.cursor() as cursor:
        cursor.execute(f"SHOW COLUMNS FROM `Product` LIKE %s;", [column_name])
        result = cursor.fetchone()
    return bool(result)  # Returns True if column exists, False otherwise


from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_product_quantities(request):
    data = request.data.get('data', [])
    date = request.data.get('date')
    company_id = request.data.get('company_id')

    if not date or not data:
        return JsonResponse({"status": "error", "message": "Missing date or data."}, status=400)

    if not company_id:
        return JsonResponse({"status": "error", "message": "Missing company ID."}, status=400)

    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Invalid company ID."}, status=400)

    if not check_column_exists(date):
        add_dynamic_column(date)

    total_records = 0
    updated_records = 0
    new_records = 0
    product_details = {}

    # Store the last occurrence of each product
    last_occurrences = {}

    for item in data:
        product_name = (
            item.get('productName') or
            item.get('Product Name') or
            item.get('product_name')
        )
        quantity = (
            item.get('quantity') or
            item.get('Quantity') or
            item.get('qty')
        )

        if not product_name:
            continue

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            quantity = 0

        last_occurrences[product_name.strip()] = quantity

    for product_name, quantity in last_occurrences.items():
        product, created = Product.objects.get_or_create(
            product_name=product_name,
            company=company,
            defaults={'created_by': request.user}
        )
        
        if not created and product.created_by is None:
            # Update created_by if missing (be careful with this)
            product.created_by = request.user
            product.save(update_fields=['created_by'])

        if created:
            new_records += 1
        else:
            was_updated = update_dynamic_quantity(product_name, date, quantity, company.id)
            if was_updated:
                updated_records += 1

        total_records += 1

        # Add product details to response
        product_details[product_name] = {
            "id": product.id,
            "created_by_id": product.created_by_id,
            "company_id": product.company_id,
            "quantity":quantity
        }

    return JsonResponse({
        "status": "success",
        "message": f"Data for {date} uploaded.",
        "total_records": total_records,
        "updated_records": updated_records,
        "new_records": new_records,
        "products": product_details  # ✅ Include product info with IDs
    })



from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Product, Company
from django.db import connection

@csrf_exempt
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def sync_product_quantities(request):
    company_id = request.data.get('company_id')
    date = request.data.get('date')

    if not company_id or not date:
        return JsonResponse({"status": "error", "message": "Missing company ID or date."}, status=400)

    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Invalid company ID."}, status=400)

    # Ensure dynamic column exists
    if not check_column_exists(date):
        add_dynamic_column(date)

    # Fetch data from Tally DB
    sql = """
    WITH item_movements AS (
        SELECT 
            vit.itemguid,
            SUM(CAST(REPLACE(vit.quantity, ',', '') AS DECIMAL(18,6))) AS movements_quantity
        FROM voucher_inventory_transaction vit
        JOIN voucher_master vm ON vit.masterid = vm.masterid
        JOIN voucher_type_master vtm ON vm.vouchertypeguid = vtm.guid
        WHERE vtm.name IN (
            'Purchase','DC PURCHASE','Sales Return','Credit Note',
            'Retail Sales','DC SALES','DEBIT NOTES','Tax Sales',
            'Stock Journal','Physical Stock','DC'
        )
        GROUP BY vit.itemguid
    )
    SELECT 
        sim.name AS item_name,
        sim.guid AS itemguid,
        CAST(REPLACE(sim.opbalance, ',', '') AS DECIMAL(18,6)) AS opening_quantity,
        COALESCE(im.movements_quantity,0) AS movements_quantity,
        CAST(REPLACE(sim.opbalance, ',', '') AS DECIMAL(18,6)) + COALESCE(im.movements_quantity,0) AS closing_quantity
    FROM stock_item_master sim
    LEFT JOIN item_movements im ON sim.guid = im.itemguid
    ORDER BY sim.name;
    """

    with connections['tally'].cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        col_names = [col[0] for col in cursor.description]

    total_records = 0
    new_records = 0
    updated_records = 0
    product_details = {}

    # Update each product
    for row in rows:
        row_data = dict(zip(col_names, row))
        product_name = row_data['item_name']
        closing_quantity = row_data['closing_quantity'] or 0

        if not product_name:
            continue

        # Ensure product exists or create
        product, created = Product.objects.get_or_create(
            product_name=product_name.strip(),
            company=company,
            defaults={'created_by': request.user}
        )

        # Ensure created_by is set
        if not created and product.created_by is None:
            product.created_by = request.user
            product.save(update_fields=['created_by'])

        # Update dynamic quantity
        if not created and update_dynamic_quantity(product_name, date, closing_quantity, company.id):
            updated_records += 1
        elif created:
            new_records += 1

        total_records += 1

        product_details[product_name] = {
            "id": product.id,
            "created_by_id": product.created_by_id,
            "company_id": product.company_id,
            "closing_quantity": closing_quantity
        }

    return JsonResponse({
        "status": "success",
        "message": f"Stock data synced for {date}.",
        "total_records": total_records,
        "new_records": new_records,
        "updated_records": updated_records,
        "products": product_details
    })



from datetime import datetime
from django.http import JsonResponse
from django.db import connection
from .models import Product  # Adjust the import based on your app structure

def check_column_exists(date_str):
    # Directly use the date_str to form the column name
    column_name = f'quantity_{date_str}'
    print(f"Checking for column: {column_name}")

    with connection.cursor() as cursor:
        query = "SHOW COLUMNS FROM Product LIKE %s;"
        print(f"Executing query: {query} with params: {[column_name]}")
        cursor.execute(query, [column_name])
        result = cursor.fetchone()

    if result:
        print(f"Column {column_name} found!")
    else:
        print(f"Column {column_name} not found.")

    return bool(result)

def check_file_uploaded(request, date):
    print(f"Received date: {date}")

    # Convert the provided date string to a datetime object
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        print(f"Parsed date: {date_obj}")
    except ValueError:
        return JsonResponse({"status": "error", "message": "Invalid date format."}, status=400)

    # Check if the column exists for the given date
    column_exists = check_column(date)
    print(f"Column exists for {date}: {column_exists}")

    if not column_exists:
        return JsonResponse({"status": "error", "message": f"Column for the date {date} does not exist."}, status=400)

    # Check if the file was uploaded (check the product's created_at date)
    existing_file = Product.objects.filter(created_at__date=date_obj).exists()

    if existing_file:
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'failure'})



from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ProductStock, Product, Warehouse
from .serializers import ProductStockSerializer
from datetime import date
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

@api_view(['GET'])
def get_stock_by_warehouse(request):
    warehouse_id = request.GET.get('warehouse_id')

    # Always use current date in IST
    now_ist = datetime.now(IST).date()

    stocks = ProductStock.objects.filter(warehouse_id=warehouse_id, date=now_ist)
    serializer = ProductStockSerializer(stocks, many=True)
    return Response(serializer.data)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from pytz import timezone
from .models import ProductStock, Product
from .serializers import ProductStockSerializer

IST = timezone('Asia/Kolkata')

@api_view(['POST'])
def update_stock(request):
    data = request.data
    product_id = data.get('product_id')
    warehouse_id = data.get('warehouse_id')
    quantity = data.get('quantity')

    if not (product_id and warehouse_id and quantity is not None):
        return Response({"error": "product_id, warehouse_id, and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    now_ist = datetime.now(IST).date()  # Use IST date, ignore user date input

    stock, created = ProductStock.objects.update_or_create(
        product_id=product_id,
        warehouse_id=warehouse_id,
        date=now_ist,
        defaults={
            'quantity': quantity,
            'company_id': product.company_id,  # Set company from product
        }
    )
    return Response(ProductStockSerializer(stock).data, status=status.HTTP_200_OK)



from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ProductStock, Product
from datetime import datetime
from django.db.models import Max

@api_view(['GET'])
def get_current_and_previous_stock(request):
    warehouse_id = request.GET.get('warehouse_id')
    stock_date_str = request.GET.get('date')

    if not warehouse_id or not stock_date_str:
        return Response({'error': 'warehouse_id and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        stock_date = datetime.strptime(stock_date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    products = Product.objects.filter(warehouses__id=warehouse_id).distinct()

    # ✅ Find latest previous date with any stock entry before stock_date
    previous_date = ProductStock.objects.filter(
        warehouse_id=warehouse_id,
        date__lt=stock_date
    ).aggregate(latest=Max('date'))['latest']

    # Build a map of previous stock (if date exists)
    previous_stock_map = {}
    if previous_date:
        prev_stocks = ProductStock.objects.filter(
            warehouse_id=warehouse_id,
            date=previous_date
        )
        previous_stock_map = {ps.product_id: ps.quantity for ps in prev_stocks}

    # Get current stock in a map
    current_stocks = ProductStock.objects.filter(
        warehouse_id=warehouse_id,
        date=stock_date
    )
    current_stock_map = {ps.product_id: ps.quantity for ps in current_stocks}

    response_data = []
    for product in products:
        response_data.append({
            'product_id': product.id,
            'product_name': product.product_name,
            'current_quantity': current_stock_map.get(product.id),
            'previous_quantity': previous_stock_map.get(product.id),
            'previous_date': previous_date
        })

    return Response(response_data, status=status.HTTP_200_OK)




from datetime import datetime
import pytz
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_today_date(request):
    ist = pytz.timezone("Asia/Kolkata")
    now_ist = datetime.now(ist).date()
    return Response({"today": now_ist.isoformat()})


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Role
from .serializers import RoleSerializer

@api_view(['GET'])
def get_roles(request):
    user = request.user

    # Get all roles
    roles = Role.objects.all().order_by('role')

    # If the user is not a techadmin, exclude the superadmin role
    if user.role.lower() != 'techadmin':
        roles = roles.exclude(role__iexact='superadmin')

    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ShowPrevDateSetting
from .serializers import ShowPrevDateSettingSerializer

class ShowPrevDateSettingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = ShowPrevDateSetting.objects.all()
        serializer = ShowPrevDateSettingSerializer(settings, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        if not hasattr(user, "role") or user.role != "superadmin":
            return Response({"error": "Only superadmin can update settings."}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name")
        show = request.data.get("show")

        if name is None or show is None:
            return Response({"error": "Both 'name' and 'show' fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        def str_to_bool(value):
            return str(value).lower() in ["true", "1", "yes"]

        try:
            setting, created = ShowPrevDateSetting.objects.get_or_create(name=name)
            setting.show = str_to_bool(show)
            setting.save()
            return Response({
                "success": True,
                "created": created,
                "setting": ShowPrevDateSettingSerializer(setting).data
            })
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from collections import defaultdict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import connection
from .models import Product, ProductStock
import re

import re
from datetime import datetime
from collections import defaultdict
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models import Product, ProductStock, Warehouse

def generate_column_name(date_str):
    return f"quantity_{re.sub(r'[^0-9a-zA-Z]', '-', date_str)}"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_product_stock_overview(request):
    selected_warehouses = request.data.get('warehouse_ids', [])

    if not selected_warehouses:
        return Response({'success': False, 'message': 'No warehouses selected.'}, status=400)

    current_date = timezone.now().date()
    selected_warehouses = [int(w_id) for w_id in selected_warehouses]

    # --- Get latest ProductStock date before today PER WAREHOUSE ---
    warehouse_prev_date_map = {
        w.id: (
            ProductStock.objects
            .filter(warehouse_id=w.id, date__lt=current_date)
            .order_by('-date')
            .values_list('date', flat=True)
            .first()
        )
        for w in Warehouse.objects.filter(id__in=selected_warehouses)
    }

    # --- Build stock_map using per-product-per-warehouse logic ---
    stock_map = defaultdict(lambda: defaultdict(dict))

    for product in Product.objects.all():
        for warehouse_id in selected_warehouses:
            prev_date = warehouse_prev_date_map.get(warehouse_id)
            for date in [current_date, prev_date]:
                if not date:
                    continue
                stock_entry = ProductStock.objects.filter(
                    product_id=product.id,
                    warehouse_id=warehouse_id,
                    date=date
                ).first()
                if stock_entry:
                    stock_map[product.id][warehouse_id][date] = stock_entry.quantity

    # --- Get available dynamic quantity columns from Product table ---
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COLUMN_NAME FROM information_schema.columns
            WHERE table_name = 'Product' AND table_schema = DATABASE()
              AND COLUMN_NAME LIKE 'quantity_%'
        """)
        available_columns = [row[0] for row in cursor.fetchall()]

    # Extract and sort the dynamic column dates
    dynamic_column_dates = []
    for col in available_columns:
        match = re.match(r'quantity_(\d{4}-\d{2}-\d{2})', col)
        if match:
            try:
                dynamic_column_dates.append(datetime.strptime(match.group(1), "%Y-%m-%d").date())
            except:
                continue

    dynamic_column_dates = sorted(dynamic_column_dates)
    dynamic_prev_date = None
    for d in reversed(dynamic_column_dates):
        if d < current_date:
            dynamic_prev_date = d
            break

    col_current = generate_column_name(str(current_date))
    col_prev = generate_column_name(str(dynamic_prev_date)) if dynamic_prev_date else None

    dynamic_cols = ['id', 'product_name']
    has_prev_col = col_prev in available_columns
    has_curr_col = col_current in available_columns

    if has_prev_col:
        dynamic_cols.append(col_prev)
    if has_curr_col:
        dynamic_cols.append(col_current)

    # --- Fetch dynamic columns from Product table ---
    with connection.cursor() as cursor:
        col_str = ', '.join(f"`{col}`" for col in dynamic_cols)
        cursor.execute(f"SELECT {col_str} FROM `Product`")
        rows = cursor.fetchall()

    # Map product_id → dynamic stock info
    product_data = {}
    for row in rows:
        product_id = row[0]
        product_name = row[1]
        idx = 2

        prev_qty = row[idx] if has_prev_col else 0
        if has_prev_col:
            idx += 1
        curr_qty = row[idx] if has_curr_col else 0

        product_data[product_id] = {
            'product_name': product_name,
            'dynamic_prev_stock': prev_qty,
            'dynamic_current_stock': curr_qty
        }

    # --- Build the response ---
    response_products = []

    for product_id, data in product_data.items():
        total_prev = 0
        total_current = 0
        warehouses_data = {}

        for w_id in selected_warehouses:
            prev_date = warehouse_prev_date_map.get(w_id)

            prev_qty = stock_map[product_id].get(w_id, {}).get(prev_date, 0) if prev_date else 0
            curr_qty = stock_map[product_id].get(w_id, {}).get(current_date, 0)

            total_prev += prev_qty or 0
            total_current += curr_qty or 0

            warehouses_data[str(w_id)] = {
                'prev_stock': prev_qty,
                'current_stock': curr_qty
            }

        response_products.append({
            'product_id': product_id,
            'product_name': data['product_name'],
            'total_prev_stock': total_prev,
            'total_current_stock': total_current,
            'stock_difference': total_current - total_prev,
            'warehouses': warehouses_data,
            'dynamic_column_stock': {
                col_prev if has_prev_col else '': data['dynamic_prev_stock'],
                col_current if has_curr_col else '': data['dynamic_current_stock']
            }
        })

    return Response({
        'success': True,
        'product_stock_prev_date': {
            str(k): str(v) for k, v in warehouse_prev_date_map.items() if v
        },
        'product_table_prev_date': str(dynamic_prev_date) if dynamic_prev_date else None,
        'current_date': str(current_date),
        'products': response_products
    })



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_product_column_or_stock(request):
    date_str = request.data.get('date')
    warehouse_id = request.data.get('warehouse_id')
    action = request.data.get('action')
    company_id = request.data.get('company_id')

    # Validate required fields
    if not date_str or not action:
        return Response({"error": "Both 'date' and 'action' are required."}, status=400)
    if not company_id:
        return Response({"error": "'company_id' is required."}, status=400)

    user = request.user

    # Check if the user is authorized for the company
    if user.role != "superadmin" and int(company_id) not in [c.id for c in user.companies.all()]:
        return Response({"error": "Unauthorized company access."}, status=403)

    if action == "Tally":
        if user.role != "superadmin":
            return Response({"error": "Only superadmins can modify Tally data."}, status=403)

        column_name = f"quantity_{date_str}"

        with connection.cursor() as cursor:
            # Check if the column exists
            cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'Product' AND column_name = %s
            """, [column_name])
            exists = cursor.fetchone()

            if not exists:
                return Response({"error": f"Column '{column_name}' does not exist."}, status=404)

            try:
                # Set values to NULL
                cursor.execute(
                    f"""UPDATE `Product` SET `{column_name}` = NULL WHERE `company_id` = %s""",
                    [company_id]
                )
                affected = cursor.rowcount
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        return Response({"message": f"Reset '{column_name}' to NULL for {affected} products."})

    elif action == "Count":
        if not warehouse_id:
            return Response({"error": "'warehouse_id' is required for 'Count' action."}, status=400)

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE `product_stocks`
                    SET `quantity` = NULL
                    WHERE `warehouse_id` = %s AND `date` = %s AND `company_id` = %s
                """, [warehouse_id, date_str, company_id])
                
                rows_affected = cursor.rowcount

                if rows_affected == 0:
                    return Response({"error": "No data found for the given warehouse, date, and company."}, status=404)

            return Response({"message": f"Data for warehouse ID {warehouse_id} on {date_str} removed successfully."})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    return Response({"error": "Invalid action or missing parameters."}, status=400)


from django.http import JsonResponse
from django.db import connection

def check_existing_upload(request, date):
    column_name = f'quantity_{date}'

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'Product'
        """)
        columns = [row[0] for row in cursor.fetchall()]

    column_exists = column_name in columns

    return JsonResponse({'exists': column_exists})





# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models import User
from rest_framework import status
from django.contrib.auth.hashers import make_password

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_superadmins(request):
    if request.user.role != 'techadmin':
        return Response({'detail': 'Unauthorized'}, status=403)
    
    users = User.objects.filter(role='superadmin')
    data = [{"id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name} for u in users]
    return Response(data)
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_superadmin(request):
    if request.user.role != 'techadmin':
        return Response({'detail': 'Unauthorized'}, status=403)

    data = request.data
    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Username already exists'}, status=400)

    try:
        user = User.objects.create(
            username=data['username'],
            password=make_password(data['password']),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role='superadmin'
        )
        return Response({'message': 'Superadmin created'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_superadmin(request, user_id):
    if request.user.role != 'techadmin':
        return Response({'detail': 'Unauthorized'}, status=403)

    try:
        user = User.objects.get(id=user_id, role='superadmin')
    except User.DoesNotExist:
        return Response({'error': 'Superadmin not found'}, status=404)

    data = request.data
    user.username = data.get('username', user.username)
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    if data.get('password'):
        user.password = make_password(data['password'])

    if User.objects.exclude(id=user.id).filter(username=user.username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    user.save()
    return Response({'message': 'Superadmin updated'})



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_superadmin(request, user_id):
    if request.user.role != 'techadmin':
        return Response({'detail': 'Unauthorized'}, status=403)

    try:
        user = User.objects.get(id=user_id, role='superadmin')
        user.delete()
        return Response({'message': 'Superadmin deleted'})
    except User.DoesNotExist:
        return Response({'error': 'Superadmin not found'}, status=404)
    

    
import re
from collections import defaultdict
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection
from api.models import Product, ProductStock, Warehouse


def generate_column_name(date_str):
    return f"quantity_{date_str}"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_selected_prev_date_stock(request):
    try:
        selected_date = request.data.get('selected_date')
        selected_warehouses = request.data.get('warehouse_ids', [])

        if not selected_date:
            return JsonResponse({'success': False, 'message': 'Selected date is required'}, status=400)

        if not selected_warehouses:
            return JsonResponse({'success': False, 'message': 'At least one warehouse must be selected'}, status=400)

        # Ensure warehouse IDs are integers
        selected_warehouses = [int(w_id) for w_id in selected_warehouses]
        formatted_col_name = generate_column_name(selected_date)

        # Check for dynamic column in product table
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COLUMN_NAME FROM information_schema.columns
                WHERE table_name = 'Product' AND table_schema = DATABASE()
                  AND COLUMN_NAME LIKE 'quantity_%%'
            """)
            available_columns = [row[0] for row in cursor.fetchall()]

        has_prev_col = formatted_col_name in available_columns
        col_prev = formatted_col_name if has_prev_col else ''

        # Fetch product basic data + dynamic column
        dynamic_cols = ['id', 'product_name']
        if has_prev_col:
            dynamic_cols.append(formatted_col_name)

        col_str = ', '.join(f"`{col}`" for col in dynamic_cols)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT {col_str} FROM Product")
            product_rows = cursor.fetchall()

        product_data = {}
        for row in product_rows:
            product_id = row[0]
            product_name = row[1]
            dynamic_prev_stock = row[2] if has_prev_col else 0
            product_data[product_id] = {
                'product_name': product_name,
                'dynamic_prev_stock': dynamic_prev_stock
            }

        # Fetch product stock entries for selected warehouse(s) + date
        stock_map = defaultdict(lambda: defaultdict(int))
        stock_entries = ProductStock.objects.filter(
            warehouse_id__in=selected_warehouses,
            date=selected_date
        )

        for stock in stock_entries:
            stock_map[stock.product_id][stock.warehouse_id] += stock.quantity

        # Ensure every product has data, even if quantity is 0
        response_products = []
        for product_id, data in product_data.items():
            total_prev = 0
            warehouses_data = {}

            for w_id in selected_warehouses:
                prev_qty = stock_map[product_id].get(w_id, 0)
                total_prev += prev_qty
                warehouses_data[str(w_id)] = {
                    'prev_stock': prev_qty,
                    'selected_stock': prev_qty
                }

            response_products.append({
                'product_id': product_id,
                'product_name': data['product_name'],
                'total_prev_stock': total_prev,
                'stock_difference': -total_prev,
                'warehouses': warehouses_data,
                'dynamic_column_stock': {
                    col_prev: data['dynamic_prev_stock'] if has_prev_col else 0
                }
            })

        return Response({
            'success': True,
            'product_stock_prev_date': {str(w_id): selected_date for w_id in selected_warehouses},
            'product_table_prev_date': str(selected_date),
            'products': response_products
        })

    except Exception as e:
        return Response({'success': False, 'message': str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user  # Get the currently authenticated user

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Both current and new passwords are required'}, status=400)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({'success': 'Password updated successfully'})


from rest_framework import viewsets
from .models import Company
from .serializers import CompanySerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context




# views.py
from django.http import JsonResponse
from django.http import JsonResponse
from django.db import connections  # ✅ this line is required
from django.views.decorators.http import require_GET

from django.views.decorators.http import require_GET

from django.http import JsonResponse
from django.db import connections
from django.views.decorators.http import require_GET

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connections
from django.http import JsonResponse
from django.db import connections
from django.views.decorators.http import require_GET
from collections import defaultdict

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from collections import defaultdict
from django.db import connections

from collections import defaultdict
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connections

from datetime import datetime, timedelta
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET", "POST"])
def report_dashboard(request, id=None):
    if request.method == "POST":
        try:
            request_data = json.loads(request.body)
        except Exception as e:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)
    else:
        request_data = request.GET
    # Filters
    city = request_data.get("city", [])
    product = request_data.get("product", [])
    sales_person = request_data.get("salesPerson", [])
    vouchertype = request_data.get("vouchertype", [])
    vouchernumber = request_data.get("vouchernumber", [])
    client = request_data.get("client", [])
    duration = request_data.get("duration", "")
    search = request_data.get("search", "")
    duration_period = request_data.get("durationPeriod", "").lower()
    row_header_raw = request_data.get("rowHeader", "").strip().lower()
    column_header_raw = request_data.get("columnHeader", "").strip().lower()
    row_values = request_data.get("rowValues", [])
    col_values = request_data.get("columnValues", [])
    view_type = request_data.get("viewType", "currency").lower()

    


    # Headers for pivot table
    view_type = request_data.get("viewType", "currency").lower()
    value_field = "amount" if view_type == "currency" else "quantity"

    row_header_raw = request_data.get("rowHeader", "").strip().lower()
    column_header_raw = request_data.get("columnHeader", "").strip().lower()


    # Map frontend label to backend field
    FIELD_MAP = {
    "sales person": "salesPerson",
    "city": "city",
    "products": "product",
    "duration": "date",
    "client": "client",
    "voucher type": "vouchertype",
    "voucher": "vouchernumber",
}


    if row_header_raw not in FIELD_MAP or column_header_raw not in FIELD_MAP:
        return JsonResponse({"error": "Invalid row or column header"}, status=400)

    row_field = FIELD_MAP[row_header_raw]
    col_field = FIELD_MAP[column_header_raw]
    row_header_label = request.GET.get("rowHeader", "Row Header")
    col_header_label = request.GET.get("columnHeader", "Column Header")
    # New: Selected dropdown values for filtering (row/col header values)
    row_values = request_data.get("rowValues")
    col_values = request_data.get("columnValues")

    def normalize_value(field, val):
        if field == "city":
            return val.strip().upper()
        return val.strip()

    row_values = [normalize_value(row_field, v) for v in row_values]
    col_values = [normalize_value(col_field, v) for v in col_values]

    def resolve_field(field):
        field_map_sql = {
            "city": "TRIM(SUBSTRING_INDEX(vm.partyledger, '-', -1))",
            "salesPerson": "vm.vchsalesman",
            "product": "sim.name",
            "client": "vm.partyledger",
            "vouchertype": "vm.vouchertype",
            "vouchernumber": "vm.vouchernumber",
            "date": "vm.date"
        }
        resolved = field_map_sql.get(field)
        if not resolved:
            print(f"❌ Unknown field: {field}")
            return None
        return resolved
    
    row_field = FIELD_MAP.get(row_header_raw)
    col_field = FIELD_MAP.get(column_header_raw)

    if not row_field or not col_field:
        return JsonResponse({"error": "Invalid row or column header"}, status=400)

    if not resolve_field(row_field) or not resolve_field(col_field):
        return JsonResponse({"error": "Cannot resolve field mappings"}, status=500)


    # ✅ If no row/col values are passed, fetch all possible values for that header
    with connections['tally'].cursor() as cursor:
        if not row_values:
            try:
                cursor.execute(f"""
                    SELECT DISTINCT {resolve_field(row_field)} 
                    FROM tally_sync_atpl_xihth.voucher_master vm 
                    LEFT JOIN tally_sync_atpl_xihth.voucher_inventory_transaction vit ON vm.guid = vit.guid 
                    LEFT JOIN tally_sync_atpl_xihth.stock_item_master sim ON TRIM(vit.itemname) = TRIM(sim.name)
                    WHERE {resolve_field(row_field)} IS NOT NULL
                """)
                row_values = [normalize_value(row_field, r[0]) for r in cursor.fetchall() if r[0]]
            except Exception as e:
                print("⚠️ Error auto-fetching rowValues:", e)



        if not col_values:
            try:
                cursor.execute(f"""
                    SELECT DISTINCT {resolve_field(col_field)} 
                    FROM tally_sync_atpl_xihth.voucher_master vm 
                    LEFT JOIN tally_sync_atpl_xihth.voucher_inventory_transaction vit ON vm.guid = vit.guid 
                    LEFT JOIN tally_sync_atpl_xihth.stock_item_master sim ON TRIM(vit.itemname) = TRIM(sim.name)
                    WHERE {resolve_field(col_field)} IS NOT NULL
                """)
                col_values = [normalize_value(col_field, r[0]) for r in cursor.fetchall() if r[0]]
            except Exception as e:
                print("⚠️ Error auto-fetching columnValues:", e)


    # Decide query based on whether voucher-specific fields are selected
    if row_field in ["client", "vouchertype", "vouchernumber"] or col_field in ["client", "vouchertype", "vouchernumber"]:
        query = """
    SELECT 
       cm.name AS company,
       vm.vouchernumber,
       vm.date,
       vm.vouchertype,
       vm.partyledger AS client,
       vm.vchsalesman AS salesPerson,
       vit.itemname AS product,
       vit.quantity,
       vit.rate,
       vit.amount AS amount,
       '' AS uom
   FROM tally_sync_atpl_xihth.voucher_master vm
   JOIN tally_sync_atpl_xihth.company_master cm 
       ON cm.cmpguid = vm.cmpguid
   JOIN tally_sync_atpl_xihth.voucher_inventory_transaction vit 
       ON vit.masterid = vm.masterid
   WHERE vit.itemname IS NOT NULL


        """
    
    
    else:
        query = """
        SELECT 
            TRIM(SUBSTRING_INDEX(vm.partyledger, '-', -1)) AS city,
            vm.vchsalesman AS salesPerson,
            sim.name AS product,
            sim.uom AS uom,
            vit.quantity,
            vit.amount,
            vm.date
        FROM 
            tally_sync_atpl_xihth.voucher_master vm
        JOIN 
            tally_sync_atpl_xihth.voucher_inventory_transaction vit 
            ON vm.guid = vit.guid
        JOIN 
            tally_sync_atpl_xihth.stock_item_master sim 
            ON TRIM(vit.itemname) = TRIM(sim.name)
        WHERE 
            vm.vchsalesman IS NOT NULL
            AND vm.partyledger LIKE '%%-%%'
            AND sim.name IS NOT NULL"""
        
     # Make sure row_field and col_field are in the SELECT list
    # Force row_field and col_field into SELECT if not present
   # Force row_field and col_field into SELECT if not present
    needed_fields = {row_field, col_field}
    for field in needed_fields:
        resolved = resolve_field(field)
        alias_clause = f"{resolved} AS {field}"
        if alias_clause not in query:
            query = query.replace("SELECT", f"SELECT {alias_clause},", 1)

# ✅ Always add vm.date as `date`
    if "vm.date AS date" not in query:
        query = query.replace("SELECT", "SELECT vm.date AS date,", 1)


    
    filters = []
    params = []

    if row_values:
        placeholders = ','.join(['%s'] * len(row_values))
        filters.append(f"AND {resolve_field(row_field)} IN ({placeholders})")
        params.extend(row_values)

    if col_values:
        placeholders = ','.join(['%s'] * len(col_values))
        filters.append(f"AND {resolve_field(col_field)} IN ({placeholders})")
        params.extend(col_values)


    if city:
            placeholders = ','.join(['%s'] * len(city))
            filters.append(f"AND TRIM(SUBSTRING_INDEX(vm.partyledger, '-', -1)) IN ({placeholders})")
            params.extend(city)

    if product:
            placeholders = ','.join(['%s'] * len(product))
            filters.append(f"AND sim.name IN ({placeholders})")
            params.extend(product)

    if sales_person:
            placeholders = ','.join(['%s'] * len(sales_person))
            filters.append(f"AND vm.vchsalesman IN ({placeholders})")
            params.extend(sales_person)

    if vouchertype:
            placeholders = ','.join(['%s'] * len(vouchertype))
            filters.append(f"AND vm.vouchertype IN ({placeholders})")
            params.extend(vouchertype)

    if vouchernumber:
            placeholders = ','.join(['%s'] * len(vouchernumber))
            filters.append(f"AND vm.vouchernumber IN ({placeholders})")
            params.extend(vouchernumber)

    if client:
            placeholders = ','.join(['%s'] * len(client))
            filters.append(f"AND vm.partyledger IN ({placeholders})")
            params.extend(client)

    if duration and duration.strip():
        duration = duration.strip()

        today = now().date()

        if duration == "today":
                filters.append("AND vm.date = %s")
                params.append(str(today))

        elif duration == "yesterday":
                filters.append("AND vm.date = %s")
                params.append(str(today - timedelta(days=1)))

        elif duration == "this_week":
                start = today - timedelta(days=today.weekday())
                end = start + timedelta(days=6)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(end)])

        elif duration == "last_week":
                start = today - timedelta(days=today.weekday() + 7)
                end = start + timedelta(days=6)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(end)])

        elif duration == "last_7_days":
                start = today - timedelta(days=6)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(today)])

        elif duration == "this_month":
                start = today.replace(day=1)
                end = (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(end)])

        elif duration == "last_month":
                this_month_start = today.replace(day=1)
                end = this_month_start - timedelta(days=1)
                start = end.replace(day=1)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(end)])

        elif duration == "last_30_days":
                start = today - timedelta(days=29)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(today)])

        elif duration == "this_year":
                start = today.replace(month=1, day=1)
                end = today.replace(month=12, day=31)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(end)])

        elif duration == "last_365_days":
                start = today - timedelta(days=364)
                filters.append("AND vm.date BETWEEN %s AND %s")
                params.extend([str(start), str(today)])

        elif "to" in duration:
                # Optional manual range support
                try:
                    start, end = [d.strip() for d in duration.split("to")]
                    filters.append("AND vm.date BETWEEN %s AND %s")
                    params.extend([start, end])
                except Exception as e:
                    print("Manual date parse error:", e)


    if search:
        filters.append("""
            AND (
                vm.vchsalesman LIKE %s OR
                vm.partyledger LIKE %s OR
                sim.name LIKE %s OR
                vm.vouchertype LIKE %s OR
                vm.vouchernumber LIKE %s
            )
        """)
        params.extend([f"%{search}%"] * 5)




    final_query = query + " " + " ".join(filters) 

    with connections['tally'].cursor() as cursor:
            cursor.execute(final_query, params)
            columns = [col[0] for col in cursor.description]
            raw_data = [dict(zip(columns, row)) for row in cursor.fetchall()]

            pivot = defaultdict(dict)
            row_keys = set()
            col_keys = set()
            uom_map = {}

            for row in raw_data:
                def group_date(date_val, period):
                    try:
                        if isinstance(date_val, datetime):
                            dt = date_val
                        elif isinstance(date_val, date):
                            dt = datetime.combine(date_val, datetime.min.time())
                        else:
                            try:
                                dt = datetime.strptime(str(date_val), "%Y-%m-%d")
                            except Exception as e:
                                print("❌ Date parse failed:", date_val, "|", e)
                                return str(date_val)
                    except Exception as e:
                        print("❌ Grouping error:", date_val, "|", e)
                        return str(date_val)

                    if period == "daily":
                        return dt.strftime("%Y-%m-%d")
                    elif period == "weekly":
                        return f"Week {dt.strftime('%U')} ({dt.year})"
                    elif period == "monthly":
                        return dt.strftime("%B %Y")
                    elif period == "yearly":
                        return str(dt.year)
                    elif period == "all":
                        return "All Time"
                    return str(date_val)

                row_val = row.get(row_field)
                col_val = row.get(col_field)


                if row_header_raw == "duration" and duration_period:
                    row_val = group_date(row.get("date", ""), duration_period)

                if column_header_raw == "duration" and duration_period:
                    col_val = group_date(row.get("date", ""), duration_period)


                val = row.get(value_field, 0) or 0
                uom = row.get("uom", "").strip() if row.get("uom") else ""

                if col_val:
                    if view_type == "quantity":
                        uom_map[col_val] = uom
                    pivot[row_val][col_val] = pivot[row_val].get(col_val, 0) + float(val)
                    row_keys.add(row_val)
                    col_keys.add(col_val)

            # Column headers
            final_columns = [{"headerName": row_header_label, "field": "row_key", "type": "text"}]
            for col in sorted(col_keys):
                uom_suffix = f" ({uom_map.get(col, '')})" if view_type == "quantity" else ""
                final_columns.append({
                    "headerName": f"{col}{uom_suffix}",
                    "field": col,
                    "type": "currency" if view_type == "currency" else "number"
                })

            # Table data
            final_data = []
           # ✅ If grouped by duration, ignore row/col filtering
            if row_header_raw == "duration":
                row_keys_final = row_keys
            else:
                row_keys_final = (
                    set([normalize_value(row_field, v) for v in row_values])
                    if row_values else row_keys
                )

            if column_header_raw == "duration":
                col_keys_final = col_keys
            else:
                col_keys_final = (
                    set([normalize_value(col_field, v) for v in col_values])
                    if col_values else col_keys
                )


            
        
            # Ensure all selected combinations are present
            for r in sorted(row_keys_final):
                row_data = {"row_key": r}
                for c in sorted(col_keys_final):
                    val = pivot.get(r, {}).get(c, 0)
                    if view_type == "quantity":
                        unit = uom_map.get(c, "")
                        row_data[c] = f"{int(val)} {unit}" if unit else int(val)
                    else:
                        row_data[c] = round(val, 2)
                final_data.append(row_data)

            # Column headers
            final_columns = [{"headerName": row_header_label, "field": "row_key", "type": "text"}]
            for col in sorted(col_keys_final):
                uom_suffix = f" ({uom_map.get(col, '')})" if view_type == "quantity" else ""
                final_columns.append({
                    "headerName": f"{col}{uom_suffix}",
                    "field": col,
                    "type": "currency" if view_type == "currency" else "number"
                })


            # Fetch dropdown filters
            # Return only selected filters if provided, else fetch all from DB
            def get_selected_or_all(query, selected_list):
                if selected_list:
                    return selected_list
                cursor.execute(query)
                return [row[0] for row in cursor.fetchall() if row[0]]

            # Fetch dropdown filters (selected or all)
            cities = get_selected_or_all(
                "SELECT DISTINCT TRIM(SUBSTRING_INDEX(partyledger, '-', -1)) FROM tally_sync_atpl_xihth.voucher_master WHERE partyledger LIKE '%-%'",
                city
            )
            products = get_selected_or_all(
                "SELECT DISTINCT name FROM tally_sync_atpl_xihth.stock_item_master WHERE name IS NOT NULL",
                product
            )
            salesPersons = get_selected_or_all(
                "SELECT DISTINCT vchsalesman FROM tally_sync_atpl_xihth.voucher_master WHERE vchsalesman IS NOT NULL",
                sales_person
            )
            voucherTypes = get_selected_or_all(
                "SELECT DISTINCT vouchertype FROM tally_sync_atpl_xihth.voucher_master WHERE vouchertype IS NOT NULL",
                vouchertype
            )
            voucherNumbers = get_selected_or_all(
                "SELECT DISTINCT vouchernumber FROM tally_sync_atpl_xihth.voucher_master WHERE vouchernumber IS NOT NULL",
                vouchernumber
            )
            clients = get_selected_or_all(
                "SELECT DISTINCT partyledger FROM tally_sync_atpl_xihth.voucher_master WHERE partyledger IS NOT NULL",
                client
            )

            # Duration is not from DB but based on selected dates
            durations = [duration] if duration else []




    return JsonResponse({
    "columns": final_columns,
    "data": final_data,
    "filters": {
        "cities": cities,
        "products": products,
        "salesPersons": salesPersons,
        "voucherTypes": voucherTypes,
        "vouchers": voucherNumbers,
        "vouchernumber": voucherNumbers,  # for compatibility
        "clients": clients,
        "durations": durations,
    "durationPeriods": ["daily", "weekly", "monthly", "yearly", "all"],
        "rowValues": row_values,
        "columnValues": col_values,
        
    }
}, safe=False)





@require_GET
def report_filters(request):
    with connections['tally'].cursor() as cursor:
        cursor.execute("SELECT DISTINCT TRIM(SUBSTRING_INDEX(partyledger, '-', -1)) FROM tally_sync_atpl_xihth.voucher_master WHERE partyledger LIKE '%-%'")
        cities = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT name FROM tally_sync_atpl_xihth.stock_item_master WHERE name IS NOT NULL")
        products = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT vchsalesman FROM tally_sync_atpl_xihth.voucher_master WHERE vchsalesman IS NOT NULL")
        sales_persons = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT partyledger FROM tally_sync_atpl_xihth.voucher_master WHERE partyledger IS NOT NULL")
        clients = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT vouchernumber FROM tally_sync_atpl_xihth.voucher_master WHERE vouchernumber IS NOT NULL")
        vouchers = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT vouchertype FROM tally_sync_atpl_xihth.voucher_master WHERE vouchertype IS NOT NULL")
        voucher_types = [row[0] for row in cursor.fetchall()]



        # ✅ Get distinct dates from DB as duration options
        cursor.execute("""
            SELECT DISTINCT DATE(vm.date) 
            FROM tally_sync_atpl_xihth.voucher_master vm 
            WHERE vm.date IS NOT NULL 
            ORDER BY vm.date DESC
        """)
        durations = [row[0].strftime("%Y-%m-%d") for row in cursor.fetchall() if row[0]]


    return JsonResponse({
        "cities": cities,
        "products": products,
        "salesPersons": sales_persons,
        "durations": durations,
        "voucherTypes": voucher_types,
        "clients": clients,
        "vouchers": vouchers,

    })



# views.py
from django.db import connections
from rest_framework.views import APIView
from rest_framework.response import Response

class StateSalesSummaryAPIView(APIView):
    def get(self, request):
        with connections['tally'].cursor() as cursor:
            cursor.execute("""
                SELECT 
                  vm.partystate AS state,
                  SUM(vit.amount) AS total_sales
                FROM 
                  tally_sync_atpl_xihth.voucher_master vm
                JOIN 
                  tally_sync_atpl_xihth.voucher_inventory_transaction vit 
                    ON vm.guid = vit.guid
                JOIN 
                  tally_sync_atpl_xihth.stock_item_master sim 
                    ON TRIM(vit.itemname) = TRIM(sim.name)
                WHERE 
                  vm.vchsalesman IS NOT NULL
                  AND vm.partyledger LIKE '%-%'
                  AND sim.name IS NOT NULL
                GROUP BY vm.partystate
            """)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            data = [dict(zip(columns, row)) for row in rows]
        return Response(data)



from django.db import connections
from rest_framework.views import APIView
from rest_framework.response import Response
from collections import defaultdict


class AllTablesAPIView(APIView):
    def get(self, request):
        result = {"tables": {}, "relations": []}
        cursor = connections['tally'].cursor()

        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]

        for table in tables:
            # Get columns
            cursor.execute(f"SHOW COLUMNS FROM `{table}`")
            columns = [{"field": col[0], "headerName": col[0]} for col in cursor.fetchall()]

            # Get first 50 rows as preview
            cursor.execute(f"SELECT * FROM `{table}` LIMIT 50")
            rows = [dict(zip([col["field"] for col in columns], row)) for row in cursor.fetchall()]

            result["tables"][table] = {
                "columns": columns,
                "data": rows,
            }

        # Get foreign key relationships
        cursor.execute("""
            SELECT
                TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_NAME IS NOT NULL
                AND TABLE_SCHEMA = DATABASE()
        """)
        for row in cursor.fetchall():
            result["relations"].append({
                "from": f"{row[0]}.{row[1]}",
                "to": f"{row[2]}.{row[3]}"
            })

        return Response(result)
    

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import SavedReport
from .serializers import SavedReportSerializer

@method_decorator(csrf_exempt, name='dispatch')
class SavedReportListCreateAPIView(APIView):
    def get(self, request):
        reports = SavedReport.objects.all().order_by('-created_at')
        serializer = SavedReportSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SavedReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class SavedReportDetailAPIView(APIView):
    def get_object(self, pk):
        try:
            return SavedReport.objects.get(pk=pk)
        except SavedReport.DoesNotExist:
            return None

    def get(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response({'error': 'Not found'}, status=404)
        serializer = SavedReportSerializer(report)
        return Response(serializer.data)

    def put(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response({'error': 'Not found'}, status=404)
        serializer = SavedReportSerializer(report, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        report = self.get_object(pk)
        if not report:
            return Response({'error': 'Not found'}, status=404)
        report.delete()
        return Response(status=204)





from django.http import JsonResponse
from django.views.decorators.http import require_GET

@require_GET
def report_dropdowns(request):
    return JsonResponse({
        "cities": ["Mumbai", "Delhi", "Bangalore"],
        "products": ["Oil", "Ghee", "Soap"],
        "salesPersons": ["Amit", "Raj", "Priya"],
        "clients": ["Client A", "Client B", "Client C"],
        "vouchers": ["VCH123", "VCH456"],
        "voucherTypes": ["Type A", "Type B"],
        "durations": ["Q1", "Q2", "Q3", "Q4"]
    })




from django.http import JsonResponse
from django.db import connections

def static_reorder_report(request):
    # Get dynamic months from frontend
    avg_months = int(request.GET.get("avg_months", 3))
    projection_months = int(request.GET.get("projection_months", 5))
   
    query = f"""
SELECT
    ROW_NUMBER() OVER () AS `Sr No`,
    sim.name AS `Item Name`,
    asm.suppliername AS `Supplier Name`,
    IFNULL(stk.current_stock, 0) AS `Stock`,
    IFNULL(p.pending_qty, 0) AS `Pending Purchase Order`,
    (IFNULL(stk.current_stock, 0) + IFNULL(p.pending_qty, 0)) AS `Total Stock`,
    IFNULL(s.avg_monthly_qty, 0) AS `Avg. Sale`,
    {projection_months} AS `Months`,
    ({projection_months} * IFNULL(s.avg_monthly_qty, 0)) AS `Total Required`,
    (({projection_months} * IFNULL(s.avg_monthly_qty, 0))
      - (IFNULL(stk.current_stock, 0) + IFNULL(p.pending_qty, 0))) AS `Need to Order`,
    (({projection_months} * IFNULL(s.avg_monthly_qty, 0))
      - (IFNULL(stk.current_stock, 0) + IFNULL(p.pending_qty, 0))) AS `Final Order`,
    asm.stkrmb AS `RMB Value`,
    asm.stkusd AS `USD Value`
FROM
(
    SELECT 
        po.itemguid,
        SUM(po.ordered_qty) - IFNULL(SUM(rcvd.received_qty), 0) AS pending_qty,
        SUM(po.ordered_qty) AS ordered_qty
    FROM (
        SELECT 
            vbat.itemguid,
            SUM(CAST(vbat.qty AS DECIMAL(18,2))) AS ordered_qty
        FROM voucher_master vm
        JOIN voucher_batch_allocation_transaction vbat 
            ON vm.guid = vbat.guid
        WHERE vm.vouchertype = 'Purchase Order'
        GROUP BY vbat.itemguid
    ) po
    LEFT JOIN (
        SELECT 
            vbat.itemguid,
            SUM(CAST(vbat.qty AS DECIMAL(18,2))) AS received_qty
        FROM voucher_master vm
        JOIN voucher_batch_allocation_transaction vbat 
            ON vm.guid = vbat.guid
        WHERE vm.vouchertype = 'Purchase'
        GROUP BY vbat.itemguid
    ) rcvd
      ON po.itemguid = rcvd.itemguid
    WHERE (po.ordered_qty - IFNULL(rcvd.received_qty, 0)) > 0
    GROUP BY po.itemguid
) p
LEFT JOIN stock_item_master sim
    ON p.itemguid = sim.guid
LEFT JOIN audit_stock_item_master asm
    ON p.itemguid = asm.guid
LEFT JOIN (
    SELECT 
        vit.itemguid,
        ROUND(SUM(ABS(CAST(vit.quantity AS DECIMAL(18,2)))) / {avg_months}) AS avg_monthly_qty
    FROM voucher_master vm
    JOIN voucher_inventory_transaction vit
        ON vm.guid = vit.guid
    JOIN voucher_accounting_transaction vat
        ON vm.guid = vat.guid
    WHERE vat.ledger = 'Sales'
      AND STR_TO_DATE(vm.date, '%Y-%m-%d') >= CURDATE() - INTERVAL {avg_months} MONTH
    GROUP BY vit.itemguid
) s 
    ON p.itemguid = s.itemguid
LEFT JOIN (
    SELECT 
        vit.itemguid,
        ROUND(SUM(CAST(vit.quantity AS DECIMAL(18,2)))) AS current_stock
    FROM voucher_inventory_transaction vit
    GROUP BY vit.itemguid
) stk
    ON p.itemguid = stk.itemguid;
"""

    with connections['tally'].cursor() as cursor:
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        data = []
        for row in cursor.fetchall():
            row_dict = {}
            for col, val in zip(columns, row):
                if col in [
                    "Stock", "Pending Purchase Order", "Total Stock", "Avg. Sale",
                    "Months", "Total Required", "Need to Order", "Final Order",
                    "RMB Value", "USD Value"
                ]:
                    try:
                        row_dict[col] = float(val) if '.' in str(val) else int(val)
                    except (ValueError, TypeError):
                        row_dict[col] = 0
                else:
                    row_dict[col] = val
            data.append(row_dict)

    formatted_columns = []
    for col in columns:
        col_type = "currency" if "Value" in col else (
            "number" if col not in ["Item Name", "Supplier Name"] else "text"
        )
        formatted_columns.append({
            "field": col,
            "headerName": col,
            "type": col_type
        })

    return JsonResponse({
        "columns": formatted_columns,
        "rows": data
    })


