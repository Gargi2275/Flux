from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import JSONField

class Role(models.Model):
    role = models.CharField(max_length=100,unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Role'  # Custom table name

    def __str__(self):
        return self.role

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        user = self.model(username=username, **extra_fields)
        user.set_password(password)  # hashes password
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Explicitly defining password field
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    last_login = None  
    companies = models.ManyToManyField(
        'Company',
        blank=True,
        related_name='users'
    )
    created_by = models.ForeignKey(
    'self',
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='created_users'
)


    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "username"

    class Meta:
        db_table = 'Users'  

    def __str__(self):
        return self.username



from django.db import models
from django.utils import timezone
from django.conf import settings

class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField()

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='warehouses')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_warehouses'
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouses'
        verbose_name = 'Warehouse'
        verbose_name_plural = 'Warehouses'
        unique_together = ('name', 'company')  # warehouse name must be unique within a company

    def __str__(self):
        return f"{self.name} ({self.company.name})"



from django.conf import settings
from django.db import models
from django.utils import timezone

class Product(models.Model):
    product_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='products')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_products'
    )

    warehouses = models.ManyToManyField(
        'Warehouse',
        through='ProductWarehouse',
        related_name='products'
    )

    class Meta:
        db_table = 'Product'
        unique_together = ('product_name', 'company')  # optional stricter uniqueness

    def __str__(self):
        return f"{self.product_name} ({self.company.name})"


    

class ProductWarehouse(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_warehouse'
        unique_together = ('product', 'warehouse')

# models.py  # Assuming you have this

User = get_user_model()

class UserWarehouse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table='user_warehouse'
        unique_together = ('user', 'warehouse')


class ProductStock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    date = models.DateField()
    quantity = models.IntegerField(null=True, blank=True, default=0)
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='product_stocks')  # New field

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_stocks'
        unique_together = ('product', 'warehouse', 'date', 'company')  # Consider including company here for uniqueness?

    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name} on {self.date} ({self.company.name})"

    


class ShowPrevDateSetting(models.Model):
    name = models.CharField(max_length=100, unique=True)
    show = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {'Shown' if self.show else 'Hidden'}"




class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=100, unique=True)  # e.g., 'edit_product'

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'permissions'

    def __str__(self):
        return self.name


class PermissionAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, null=True, blank=True)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    allow = models.BooleanField(default=True)
    # Only one of `user` or `role` should be non-null per row
    class Meta:
        db_table = 'permission_assignments'
        unique_together = ('user', 'role', 'permission')  # Prevents duplicate assignments

    def __str__(self):
        if self.user:
            return f"{self.user.username} - {self.permission.name} (user-specific)"
        return f"{self.role.role} - {self.permission.name} (role-wide)"


class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'

    def __str__(self):
        return self.name
    


from django.db import models
from django.contrib.postgres.fields import JSONField  # or use models.JSONField in Django 3.1+

class SavedReport(models.Model):
    name = models.CharField(max_length=255)
    row_header = models.CharField(max_length=100)
    column_header = models.CharField(max_length=100)
    filters = models.JSONField()  # store filters as JSON
    filter_values = models.JSONField(default=dict)
    row_values = models.JSONField(default=list)     # ✅ Selected values for row header
    column_values = models.JSONField(default=list) 
    created_at = models.DateTimeField(auto_now_add=True)
    hidden = models.BooleanField(default=False)

