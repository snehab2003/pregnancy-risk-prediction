from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required


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
    return render(request, 'risk.html', context)


def logout_view(request):
    """Log the user out and send back to landing page."""
    logout(request)
    return redirect('index')
