from django.contrib import admin
from .models import Profile, JournalEntry, HealthMetric, Goal, Medicine

# Register your models here.

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'trimester', 'due_date')


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'title', 'mood')
    list_filter = ('date', 'user')
    search_fields = ('title', 'content')


@admin.register(HealthMetric)
class HealthMetricAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'systolic_bp', 'diastolic_bp', 'blood_sugar', 'body_temp', 'heart_rate')
    list_filter = ('date', 'user')


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'description', 'completed', 'created_at')
    list_filter = ('completed', 'user')


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'dosage', 'schedule')
    list_filter = ('user',)
