#!/usr/bin/env python
import os
import sys
import multiprocessing
import uvicorn
from django.core.management import execute_from_command_line


def main():
    os.environ.setdefault(
        key='DJANGO_SETTINGS_MODULE',
        value='src.settings'
    )
    if 'runserver' in sys.argv:
        config = {
            'app': 'src.asgi:application',
            'host': '0.0.0.0',
            'port': 8000,
            'loop': 'uvloop',
            'http': 'httptools',
            'ws': 'none',
            'lifespan': 'off',
            'interface': 'asgi3',
            'use_colors': True
        }
        if os.environ.get('DEBUG', 1):
            uvicorn.run(**(config | {
                'reload': True
            }))
        else:
            uvicorn.run(**(config | {
                'workers': multiprocessing.cpu_count()
            }))
    else:
        execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
