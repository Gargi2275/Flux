from django.core.management.base import BaseCommand
from api.models import User
from rest_framework.authtoken.models import Token

class Command(BaseCommand):
    help = 'Creates or updates a Superadmin user'

    def handle(self, *args, **kwargs):
        current_username = 'SuPerAdMin'  # existing username
        new_username = 'SuPerAdMin'      # new username
        new_password = 'superadmin'       # new password

        try:
            user = User.objects.get(username=current_username)
            
            # Update in the correct order: username -> first_name -> last_name -> password -> role
            user.username = new_username  # First, set the username
            user.first_name = 'Super'     # Then set the first name
            user.last_name = 'Admin'      # Then set the last name
            user.set_password(new_password)  # Then set the password (hashed)
            user.role = 'superadmin'      # Finally, set the role
            user.save()

            # Update or regenerate token
            token, created = Token.objects.get_or_create(user=user)
            if not created:
                token.delete()
                token = Token.objects.create(user=user)

            self.stdout.write(self.style.SUCCESS(f"Superadmin updated successfully. New username: {new_username}"))

        except User.DoesNotExist:
            user = User.objects.create_user(
                username=new_username,
                password=new_password,
                first_name='Super',
                last_name='Admin',
                role='superadmin'
            )
            Token.objects.create(user=user)
            self.stdout.write(self.style.SUCCESS("Superadmin created successfully."))
