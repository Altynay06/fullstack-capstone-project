import secrets
import requests

base = 'http://127.0.0.1:8000/djangoapp/'
session = requests.Session()
def post(endpoint, data):
    session.get(base + 'session').raise_for_status()
    response = session.post(base + endpoint, json=data, headers={'X-CSRFToken': session.cookies['csrftoken']})
    response.raise_for_status()
    return response.json()
name = 'smoke_' + secrets.token_hex(4)
post('register', {'userName': name, 'password': secrets.token_urlsafe(20), 'firstName': 'Demo', 'lastName': 'Reviewer'})
dealers = session.get(base + 'get_dealers').json()['dealers']
assert len(dealers) > 0
cars = session.get(base + 'get_cars').json()['CarModels']
car = cars[0]
post('add_review', {'dealership': 1, 'review': 'Excellent service and a smooth purchase. Thank you!', 'purchase': True, 'purchase_date': '2023-06-15', 'car_make': car['CarMake'], 'car_model': car['CarModel'], 'car_year': 2023})
reviews = session.get(base + 'reviews/dealer/1').json()['reviews']
assert any(r['name'] == 'Demo Reviewer' and r['sentiment'] == 'positive' for r in reviews)
post('logout', {})
assert session.get(base + 'session').json()['userName'] == ''
print('PASS: registration, catalog, car inventory, review persistence, sentiment and logout')
