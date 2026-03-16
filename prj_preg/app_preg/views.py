from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import subprocess
import os
import sys
from .chatbot import ask_chatbot


def index(request):
    """Render the landing page with optional messages."""
    return render(request, 'index.html')


def login_view(request):
    """Handle user login, supporting GET and POST requests."""
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        # if email not registered give specific message so user isn't taken to error page
        if not User.objects.filter(username=email).exists():
            messages.error(request, 'User not registered. Please sign up.', extra_tags='login')
        else:
            user = authenticate(request, username=email, password=password)
            if user is not None:
                login(request, user)
                return redirect('dashboard')
            messages.error(request, 'Invalid email or password', extra_tags='login')
    # GET or failed POST should render the landing page where the login modal appears
    return render(request, 'index.html')


def register_view(request):
    """Create a new user account. On success, log the user in and redirect to dashboard."""
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        age = request.POST.get('age')
        trimester = request.POST.get('trimester')
        # basic validation
        if password != confirm_password:
            messages.error(request, 'Passwords do not match', extra_tags='register')
        elif User.objects.filter(username=email).exists():
            messages.error(request, 'A user with that email already exists', extra_tags='register')
        else:
            user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
            # populate profile fields
            profile = user.profile
            if age:
                profile.age = int(age)
            if trimester:
                try:
                    profile.trimester = int(trimester)
                except ValueError:
                    pass
            profile.save()
            login(request, user)
            return redirect('dashboard')
    return render(request, 'index.html')


@login_required
def dashboard(request):
    """Show the authenticated user's dashboard/home page."""
    context = {}
    if hasattr(request.user, 'profile'):
        context['profile'] = request.user.profile
    return render(request, 'home.html', context)



@login_required
def chat(request):
    context = {}
    if hasattr(request.user, 'profile'):
        context['profile'] = request.user.profile
    return render(request, 'chat.html', context)

@csrf_exempt
@require_POST
@login_required
def chat_api(request):
    """API endpoint for interacting with the AI Chatbot."""
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '')
        
        if not user_message:
            return JsonResponse({'error': 'Message cannot be empty'}, status=400)
            
        # Compile User Context for XAI
        user = request.user
        profile = user.profile if hasattr(user, 'profile') else None
        
        context_parts = []
        if profile:
            context_parts.append(f"Age: {profile.age}")
            if profile.trimester:
                trimesters = {1: 'First', 2: 'Second', 3: 'Third'}
                context_parts.append(f"Trimester: {trimesters.get(profile.trimester)} Trimester")
        
        # Get latest health metrics
        from .models import HealthMetric
        latest_metrics = HealthMetric.objects.filter(user=user).order_by('-date', '-id').first()
        if latest_metrics:
            context_parts.append("LATEST HEALTH METRICS:")
            context_parts.append(f"Blood Pressure: {latest_metrics.systolic_bp}/{latest_metrics.diastolic_bp} mmHg")
            context_parts.append(f"Blood Sugar: {latest_metrics.blood_sugar} mmol/L")
            context_parts.append(f"Body Temp: {latest_metrics.body_temp} C")
            context_parts.append(f"Heart Rate: {latest_metrics.heart_rate} bpm")
        
        user_context_str = "\\n".join(context_parts) if context_parts else "No user profile data provided."
        
        # Ask Chatbot
        bot_reply = ask_chatbot(user_message, user_context_str)
        
        return JsonResponse({'reply': bot_reply})
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def update_profile(request):
    """Handle profile updates from modal form."""
    if not request.user.is_authenticated:
        return redirect('login')
    if request.method == 'POST':
        profile = request.user.profile
        name = request.POST.get('name')
        age = request.POST.get('age')
        trimester = request.POST.get('trimester')
        due_date = request.POST.get('due_date')
        if name:
            request.user.first_name = name
            request.user.save()
        if age:
            profile.age = int(age)
        if trimester:
            try:
                profile.trimester = int(trimester)
            except ValueError:
                pass
        if due_date:
            profile.due_date = due_date
        # handle profile picture if provided or removal request
        if request.POST.get('remove_pic') == '1':
            # delete existing file from storage
            if profile.profile_pic:
                profile.profile_pic.delete(save=False)
            profile.profile_pic = None
        elif request.FILES.get('profile_pic'):
            profile.profile_pic = request.FILES['profile_pic']
        profile.save()
    # redirect back to the page that submitted the form
    next_page = request.POST.get('next', 'dashboard')
    return redirect(next_page)


@login_required

def goal(request):
    context = {}
    if hasattr(request.user, 'profile'):
        context['profile'] = request.user.profile
    return render(request, 'goal.html', context)


@login_required

def medicine(request):
    context = {}
    if hasattr(request.user, 'profile'):
        context['profile'] = request.user.profile
    return render(request, 'medicine.html', context)


@login_required

def risk(request):
    context = {}
    if hasattr(request.user, 'profile'):
        context['profile'] = request.user.profile

        # Get latest health metrics for the user
        from .models import HealthMetric
        latest_metrics = HealthMetric.objects.filter(user=request.user).order_by('-date', '-id').first()
        if latest_metrics:
            context['latest_metrics'] = latest_metrics
    return render(request, 'risk.html', context)


@csrf_exempt
@require_POST
@login_required
def predict_risk(request):
    """API endpoint for ML-based risk prediction."""
    try:
        data = json.loads(request.body)

        # Extract features
        age = data.get('age')
        systolic_bp = data.get('systolic_bp')
        diastolic_bp = data.get('diastolic_bp')
        blood_sugar = data.get('blood_sugar')
        body_temp = data.get('body_temp')
        heart_rate = data.get('heart_rate')

        # Validate required fields
        if not all([age, systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate]):
            return JsonResponse({'error': 'All health metrics are required'}, status=400)

        # Call the ML predictor script as a subprocess
        predictor_script = os.path.join(os.path.dirname(__file__), '..', 'ml_predictor.py')

        result = subprocess.run([
            sys.executable, predictor_script,
            str(age), str(systolic_bp), str(diastolic_bp),
            str(blood_sugar), str(body_temp), str(heart_rate)
        ], capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(__file__)))

        if result.returncode != 0:
            return JsonResponse({'error': 'Prediction failed', 'details': result.stderr}, status=500)

        # Parse the result
        try:
            prediction_result = json.loads(result.stdout.strip())
            if 'error' in prediction_result:
                return JsonResponse({'error': prediction_result['error']}, status=500)
            return JsonResponse(prediction_result)
        except:
            return JsonResponse({'error': 'Failed to parse prediction result'}, status=500)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def logout_view(request):
    """Log the user out and send back to landing page."""
    logout(request)
    return redirect('index')


@csrf_exempt
@require_POST
@login_required
def save_health_data(request):
    """API endpoint to save health metrics data."""
    try:
        data = json.loads(request.body)

        # Extract data
        date = data.get('date')
        systolic_bp = data.get('systolic_bp')
        diastolic_bp = data.get('diastolic_bp')
        blood_sugar = data.get('blood_sugar')
        body_temp = data.get('body_temp')
        heart_rate = data.get('heart_rate')

        # Validate required fields - at least one metric should be provided
        if not any([systolic_bp, diastolic_bp, blood_sugar, body_temp, heart_rate]):
            return JsonResponse({'error': 'At least one health metric is required'}, status=400)

        # Get or create HealthMetric for this date
        from .models import HealthMetric
        health_metric, created = HealthMetric.objects.get_or_create(
            user=request.user,
            date=date,
            defaults={}
        )

        # Update the fields that were provided
        if systolic_bp is not None:
            health_metric.systolic_bp = systolic_bp
        if diastolic_bp is not None:
            health_metric.diastolic_bp = diastolic_bp
        if blood_sugar is not None:
            health_metric.blood_sugar = blood_sugar
        if body_temp is not None:
            health_metric.body_temp = body_temp
        if heart_rate is not None:
            health_metric.heart_rate = heart_rate

        health_metric.save()

        return JsonResponse({
            'success': True,
            'message': 'Health data saved successfully',
            'created': created
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_health_data(request):
    """API endpoint to retrieve user's health metrics data."""
    try:
        from .models import HealthMetric
        health_metrics = HealthMetric.objects.filter(user=request.user).order_by('-date', '-id')
        
        data = []
        for metric in health_metrics:
            data.append({
                'date': metric.date.isoformat(),
                'systolic_bp': metric.systolic_bp,
                'diastolic_bp': metric.diastolic_bp,
                'blood_sugar': float(metric.blood_sugar) if metric.blood_sugar else None,
                'body_temp': float(metric.body_temp) if metric.body_temp else None,
                'heart_rate': metric.heart_rate
            })
        
        return JsonResponse({'health_data': data})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
