from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('about', TemplateView.as_view(template_name='About.html')),
    path('contact', TemplateView.as_view(template_name='Contact.html')),
    path('djangoapp/', include('djangoapp.urls')),
    re_path(r'^(?!djangoapp/|admin/|static/).*$', TemplateView.as_view(template_name='index.html')),
]
