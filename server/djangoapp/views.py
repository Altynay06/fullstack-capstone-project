import json
import logging
import requests
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from .models import CarModel
from .restapis import get_request, post_review, analyze_review_sentiments

logger = logging.getLogger(__name__)

def payload(request):
    try:
        data = json.loads(request.body)
        return data if isinstance(data, dict) else {}
    except (ValueError, UnicodeDecodeError):
        return {}

@ensure_csrf_cookie
@require_GET
def session_status(request):
    return JsonResponse({'userName': request.user.username if request.user.is_authenticated else ''})


@require_POST
def login_user(request):
    data = payload(request)
    user = authenticate(request, username=data.get('userName', ''), password=data.get('password', ''))
    if user is None:
        return JsonResponse({'error': 'Invalid username or password'}, status=401)
    login(request, user)
    return JsonResponse({'status': 'Authenticated', 'userName': user.username, 'firstname': user.first_name, 'lastname': user.last_name})

@require_POST
def logout_request(request):
    logout(request)
    return JsonResponse({'status': 'Logged out'})

@require_POST
def registration(request):
    data = payload(request)
    username = str(data.get('userName', '')).strip()
    password = data.get('password', '')
    if not username:
        return JsonResponse({'error': 'Username is required'}, status=400)
    user = User(username=username, first_name=data.get('firstName', ''), last_name=data.get('lastName', ''), email=data.get('email', ''))
    try:
        validate_password(password, user)
        user.set_password(password)
        with transaction.atomic():
            user.save()
    except ValidationError as error:
        return JsonResponse({'error': ' '.join(error.messages)}, status=400)
    except IntegrityError:
        return JsonResponse({'error': 'Username already exists'}, status=409)
    login(request, user)
    return JsonResponse({'status': 'Authenticated', 'userName': user.username, 'firstname': user.first_name, 'lastname': user.last_name})

def backend_response(function):
    def wrapped(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except (requests.RequestException, ValueError, KeyError):
            logger.exception('Backend service request failed')
            return JsonResponse({'error': 'A service is temporarily unavailable'}, status=502)
    return wrapped

@require_GET
@backend_response
def get_dealerships(request, state='All'):
    endpoint = 'fetchDealers' if state == 'All' else f'fetchDealers/{state}'
    return JsonResponse({'status': 200, 'dealers': get_request(endpoint)})

@require_GET
@backend_response
def get_dealer_details(request, dealer_id):
    return JsonResponse({'status': 200, 'dealer': get_request(f'fetchDealer/{dealer_id}')})

@require_GET
@backend_response
def get_dealer_reviews(request, dealer_id):
    reviews = get_request(f'fetchReviews/dealer/{dealer_id}')
    for review in reviews:
        review['sentiment'] = analyze_review_sentiments(review['review'])
    return JsonResponse({'status': 200, 'reviews': reviews})

@require_GET
def get_cars(request):
    return JsonResponse({'CarModels': [{'CarMake': car.car_make.name, 'CarModel': car.name, 'year': car.year} for car in CarModel.objects.select_related('car_make').all()]})

@require_POST
@backend_response
def add_review(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Please log in'}, status=401)
    data = payload(request)
    required = ('dealership', 'review', 'purchase_date', 'car_make', 'car_model', 'car_year')
    if any(not data.get(field) for field in required):
        return JsonResponse({'error': 'All review details are required'}, status=400)
    try:
        data['dealership'] = int(data['dealership'])
        data['car_year'] = int(data['car_year'])
        if not 2015 <= data['car_year'] <= 2023:
            raise ValueError()
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Invalid dealer or car year'}, status=400)
    data['name'] = request.user.get_full_name() or request.user.username
    post_review(data)
    return JsonResponse({'status': 200})
