from django.core.management.base import BaseCommand
from api.models import User
from rest_framework.authtoken.models import Token

class Command(BaseCommand):
    help = 'Creates or updates a Techadmin user (who can manage Superadmins only)'

    def handle(self, *args, **kwargs):
        current_username = 'TeChAdMin'
        new_username = 'TeChAdMin'
        new_password = 'techadmin'  # 🔒 You can change this securely

        try:
            user = User.objects.get(username=current_username)
            
            user.username = new_username
            user.first_name = 'Tech'
            user.last_name = 'Admin'
            user.set_password(new_password)
            user.role = 'techadmin'
            user.save()

            token, created = Token.objects.get_or_create(user=user)
            if not created:
                token.delete()
                token = Token.objects.create(user=user)

            self.stdout.write(self.style.SUCCESS(f"Techadmin updated successfully. New username: {new_username}"))

        except User.DoesNotExist:
            user = User.objects.create_user(
                username=new_username,
                password=new_password,
                first_name='Tech',
                last_name='Admin',
                role='techadmin'
            )
            Token.objects.create(user=user)
            self.stdout.write(self.style.SUCCESS("Techadmin created successfully."))
