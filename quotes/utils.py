import csv
import sqlite3
import requests
from bs4 import BeautifulSoup
from django.http import Http404
from quotes.models import Quotes
import multiprocessing
import asyncio
import aiohttp


# Parsing quotes names, symbols and etc.
def parse_quotes_names() -> None:
    response = requests.get(
        url='https://www.alphavantage.co/query?',
        params={
            'function': 'LISTING_STATUS',
            'apikey': Quotes.api_key,
        }
    )
    if response.status_code == 200:
        rows = csv.reader(
            response.content.decode('utf-8').splitlines(),
            delimiter=','
        )
        next(rows)
        # Creating quotes names database
        with sqlite3.connect('stocks.sqlite3') as connection:
            cursor = connection.cursor()
            cursor.execute('''DROP TABLE IF EXISTS stocks''')
            cursor.execute(
                '''CREATE TABLE IF NOT EXISTS stocks (
                    symbol VARCHAR(1024) NOT NULL UNIQUE PRIMARY KEY,
                    name VARCHAR(1024) NOT NULL
                )'''
            )
            cursor.executemany('INSERT INTO stocks (symbol, name) VALUES (?, ?)', [(row[0], row[1]) for row in rows])
            cursor.close()
    else:
        print(f'Parsing error. Http response status code is {response.status_code}')


# Return quotes of instruments with matching name or symbol
def quote_name_search(keyword):
    with sqlite3.connect('quotes/names.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute(f'''
            SELECT * FROM names WHERE name LIKE "{keyword}%" OR symbol LIKE "{keyword}%"
        ''')
        quotes = [{
            'symbol': result[0],
            'name': result[1],
            'price': result[2],
            'change': result[3],
            'change_percent': result[4],
            'volume': result[5],
            'slug': result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
            'downloaded': Quotes.objects.filter(
                slug=result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_')
            ).exists()
        } for result in cursor.fetchall()]
        cursor.close()
        return quotes


# Returns all quotes parsed
def get_all_quotes(page:int, limit:int):
    with sqlite3.connect('quotes/names.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute(
            f'''SELECT * FROM names LIMIT {limit} OFFSET {page * limit}'''
        )
        quotes = [{
            'symbol': result[0],
            'name': result[1],
            'price': result[2],
            'change': result[3],
            'change_percent': result[4],
            'volume': result[5],
            'slug': result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
        } for result in cursor.fetchall()]
        cursor.close()
        return quotes


# Paginate quotes list pages
def paginate(current_page, limit):
    with sqlite3.connect('quotes/names.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute(
            f'''SELECT * FROM names'''
        )
        total_amount = len(cursor.fetchall())
        cursor.close()
        pages_amount = (total_amount // limit) + 1 if \
            (total_amount % limit) else (total_amount // limit)
        if current_page <= 0 or current_page > pages_amount:
            raise Http404
        else:
            return {
                'page_numbers': list(
                    range(1, pages_amount + 1)
                )[(current_page - 5 if current_page - 5 >= 0 else 0):(current_page + 4)],
                'no_further': current_page == pages_amount,
                'no_back': current_page == 1,
                'current_page': current_page
            }


# if __name__ == '__main__':
#     parse_quotes_names()
