# project/urls.py (e.g., myproject/urls.py)
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
import os
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('api.urls')),
    path('api/', include('permissions_api.urls')),
]

# This must come BEFORE the React catch-all
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=os.path.join(settings.BASE_DIR, 'static'))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# React routes should come last
urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:resource>', TemplateView.as_view(template_name='index.html')),
]
