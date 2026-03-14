from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    # additional feature pages
    path('chat/', views.chat, name='chat'),
    path('goal/', views.goal, name='goal'),
    path('medicine/', views.medicine, name='medicine'),
    path('risk/', views.risk, name='risk'),
    path('api/predict-risk/', views.predict_risk, name='predict_risk'),
    path('api/save-health-data/', views.save_health_data, name='save_health_data'),
    path('api/get-health-data/', views.get_health_data, name='get_health_data'),
    path('profile/update/', views.update_profile, name='update_profile'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
