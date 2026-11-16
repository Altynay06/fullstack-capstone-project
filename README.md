# Best Cars — Full Stack Capstone Project

Repository name: fullstack-capstone-project  
Project name: Best Cars Dealership Reviews

An educational dealership application based on the [official IBM starter](https://github.com/ibm-developer-skills-network/xrwvm-fullstack_developer_capstone).

## Features

- React dealership directory, state filtering, About and Contact pages.
- Django registration, password validation, session login/logout and admin.
- Car makes/models populated from the supplied inventory.
- Express and MongoDB dealership/review API.
- Flask and NLTK VADER sentiment analysis for customer reviews.
- Authenticated review submission; reviewer identity comes from the server session.
- CSRF protection, input validation and upstream service error handling.
- GitHub Actions tests and frontend build.

## Docker

Copy .env.example to .env and set a random DJANGO_SECRET_KEY.
Run docker compose up --build, then open http://localhost:8000.
The API is available at http://localhost:3030 and sentiment at http://localhost:5050.

## Local development without Docker

Use Python 3.12 and Node 22 or newer. Create and activate a virtual environment.
Install server/requirements.txt and server/djangoapp/microservices/requirements.txt.
Inside server/frontend, run npm ci and npm run build.
Inside server/database, run npm ci --ignore-scripts, then npm run local.
This starts a real temporary MongoDB instance for local development. Its data is deleted when stopped. Production uses persistent MongoDB through MONGO_URL.
In another terminal, run python app.py inside server/djangoapp/microservices.
Inside server, run python manage.py migrate, then populate the inventory:
    python manage.py shell -c "from djangoapp.populate import initiate; initiate()"
Create an administrator with python manage.py createsuperuser.
Start Django with python manage.py runserver 127.0.0.1:8000.

## Validation

Run python manage.py test inside server and npm run build inside server/frontend.

## Submission status

Cloud deployment and final assignment submission are pending. Local addresses are not cloud deployment URLs. Evidence must be captured from actual running services.
