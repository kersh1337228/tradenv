import os
from pathlib import Path
from pymemcache import serde


BASE_DIR = Path(__file__).resolve().parent
SECRET_KEY = os.environ.get('SECRET_KEY', 'secret_key')
DEBUG = bool(os.environ.get('DEBUG', 1))


STATIC_URL = '/static/'
MEDIA_URL = '/media/'
if DEBUG:
    STATIC_ROOT = BASE_DIR.parent.parent / 'next/public/static'
    MEDIA_ROOT = BASE_DIR.parent.parent / 'next/public/media'
    ALLOWED_HOSTS = ('*',)
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'
        }
    }
else:
    STATIC_ROOT = '/var/www/static'
    MEDIA_ROOT = '/var/www/media'
    ALLOWED_HOSTS = ('next', 'django')
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
            'LOCATION': 'memcached:11211',
            'TIMEOUT': 300,
            'VERSION': 1,
            'OPTIONS': {
                'use_pooling': True,
                'serde': serde.pickle_serde,
                'no_delay': True,
                'ignore_exc': True,
                'max_pool_size': 4,
                'default_noreply': False,
                'allow_unicode_keys': True
            }
        }
    }


CORS_ALLOW_HEADERS = ['*']
CORS_ORIGINS_ALLOW_ALL = True
CSRF_COOKIE_HTTPONLY = True
APPEND_SLASH = False

INSTALLED_APPS = [
    # default
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # libs
    'rest_framework',
    'corsheaders',
    # apps
    'src.apps.stocks.apps.StocksConfig',
    'src.apps.portfolios.apps.PortfoliosConfig',
    'src.apps.strategies.apps.StrategiesConfig',
    'src.apps.logs.apps.LogsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'src.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'src.wsgi.application'
ASGI_APPLICATION = 'src.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': os.environ.get('SQL_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('SQL_DATABASE', BASE_DIR / 'db.sqlite3'),
        'USER': os.environ.get('SQL_USER', 'username'),
        'PASSWORD': os.environ.get('SQL_PASSWORD', 'password'),
        'HOST': os.environ.get('SQL_HOST', 'localhost'),
        'PORT': os.environ.get('SQL_PORT', '5432'),
    }
}
CONN_MAX_AGE = None

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = False
USE_TZ = False

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication'
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'src.utils.renderers.JSONRenderer'
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser'
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny'
    ]
}
