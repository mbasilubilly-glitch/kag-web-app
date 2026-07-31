from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth.models import User


class ContactMessageCreateTests(APITestCase):
    def test_contact_message_public_create(self):
        url = reverse('contact_message_list_create')
        payload = {
            'full_name': 'Test User',
            'email': 'test@example.com',
            'subject': 'Prayer',
            'message': 'Seeking prayers',
        }
        res = self.client.post(url, payload, format='json')
        # Public POST should be allowed
        self.assertIn(res.status_code, (200, 201))
        self.assertEqual(res.data['full_name'], 'Test User')

