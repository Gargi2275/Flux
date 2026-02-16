import os
import sys

project_home = '/home/flux/public_html'
sys.path.append(project_home)
sys.path.append(os.path.join(project_home, 'impression_backend'))

print("PYTHON PATH:", sys.path)  # Debug print

os.environ['DJANGO_SETTINGS_MODULE'] = 'impression_backend.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
