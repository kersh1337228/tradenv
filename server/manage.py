#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotes_analysis.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


def asgi():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotes_analysis.settings')
    try:
        from daphne.cli import CommandLineInterface
    except ImportError:
        raise ImportError(
            "Couldn't import daphne. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        )
    sys.argv = ['daphne', 'quotes_analysis.asgi:application']
    CommandLineInterface.entrypoint()


if __name__ == '__main__':
    if 'async' in sys.argv:
        asgi()
    else:
        main()
