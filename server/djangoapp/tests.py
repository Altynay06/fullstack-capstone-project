import json
from unittest.mock import patch
from django.test import TestCase, Client
from django.contrib.auth.models import User

class AccountTests(TestCase):
    def test_csrf_is_required_for_login(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post('/djangoapp/login', '{}', content_type='application/json').status_code, 403)
        client.get('/djangoapp/session')
        token = client.cookies['csrftoken'].value
        self.assertEqual(client.post('/djangoapp/login', '{}', content_type='application/json', HTTP_X_CSRFTOKEN=token).status_code, 401)

    def test_registration_duplicate_login_and_logout(self):
        data = {'userName': 'reviewer', 'password': 'SecureReview!9362', 'firstName': 'Test', 'lastName': 'Reviewer'}
        response = self.client.post('/djangoapp/register', json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.get(username='reviewer').check_password(data['password']))
        self.assertEqual(self.client.post('/djangoapp/register', json.dumps(data), content_type='application/json').status_code, 409)
        self.client.post('/djangoapp/logout')
        self.assertEqual(self.client.post('/djangoapp/add_review', '{}', content_type='application/json').status_code, 401)
        self.assertEqual(self.client.post('/djangoapp/login', json.dumps(data), content_type='application/json').status_code, 200)

    def test_bad_credentials_and_invalid_payload(self):
        self.assertEqual(self.client.post('/djangoapp/login', '{', content_type='application/json').status_code, 401)
        self.assertEqual(self.client.post('/djangoapp/register', '{}', content_type='application/json').status_code, 400)

class ReviewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('reviewer', password='SecureReview!9362', first_name='Actual')
        self.client.force_login(self.user)

    @patch('djangoapp.views.post_review')
    def test_author_is_taken_from_session(self, post):
        data = {'name': 'Forged name', 'dealership': 1, 'review': 'Excellent service', 'purchase_date': '2023-01-01', 'car_make': 'Kia', 'car_model': 'Seltos', 'car_year': 2023, 'purchase': True}
        response = self.client.post('/djangoapp/add_review', json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(post.call_args.args[0]['name'], 'Actual')

    @patch('djangoapp.views.get_request', return_value=[{'id': 1, 'review': 'Excellent service'}])
    @patch('djangoapp.views.analyze_review_sentiments', return_value='positive')
    def test_reviews_include_sentiment(self, sentiment, backend):
        response = self.client.get('/djangoapp/reviews/dealer/1')
        self.assertEqual(response.json()['reviews'][0]['sentiment'], 'positive')

    @patch('djangoapp.views.post_review')
    def test_invalid_review_does_not_reach_backend(self, post):
        self.assertEqual(self.client.post('/djangoapp/add_review', '{}', content_type='application/json').status_code, 400)
        post.assert_not_called()
