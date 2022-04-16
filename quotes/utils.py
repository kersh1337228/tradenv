import csv
import sqlite3
import requests
from django.http import Http404
from quotes.models import Quotes


# Parsing quotes names, symbols and etc.
def parse_quotes_names() -> None:
    # Making api request to get .csv response
    response = requests.get(
        url='https://www.alphavantage.co/query?',
        params={
            'function': 'LISTING_STATUS',
            'apikey': Quotes.api_key,
        }
    )
    # Checking if the response is successful
    if response.status_code == 200:
        # Decoding and serializing csv
        rows = csv.reader(
            response.content.decode('utf-8').splitlines(),
            delimiter=','
        )
        next(rows)  # Moving to next line to skip header row
        # Creating quotes names database
        with sqlite3.connect('quotes/stocks.sqlite3') as connection:
            cursor = connection.cursor()
            cursor.execute('''DROP TABLE IF EXISTS stocks''')
            cursor.execute(
                '''CREATE TABLE IF NOT EXISTS stocks (
                    symbol VARCHAR(1024) NOT NULL UNIQUE PRIMARY KEY,
                    name VARCHAR(1024) NOT NULL
                )'''
            )
            cursor.executemany(
                'INSERT INTO stocks (symbol, name) VALUES (?, ?)',
                [(row[0], row[1]) for row in rows]
            )
            cursor.close()
    else:
        print(f'Parsing error. Http response status code is {response.status_code}')


# Return quotes of instruments with matching name or symbol
def quote_name_search(keyword: str) -> list:
    with sqlite3.connect('quotes/stocks.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM stocks WHERE name LIKE "?%" OR symbol LIKE "?%"', (keyword,) * 2)
        quotes = [{
            'symbol': symbol,
            'name': name,
            'slug': name.lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
            'downloaded': Quotes.objects.filter(name=name).exists()
        } for symbol, name in cursor.fetchall()]
        cursor.close()
        return quotes


# Returns all quotes parsed
def get_all_quotes(page: int, limit: int) -> list :
    with sqlite3.connect('quotes/stocks.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM stocks LIMIT ? OFFSET ?', (limit, page * limit))
        quotes = [{
            'symbol': symbol,
            'name': name,
            'slug': name.lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
            'downloaded': Quotes.objects.filter(name=name).exists()
        } for symbol, name in cursor.fetchall()]
        cursor.close()
        return quotes


# Paginate quotes list pages
def paginate(current_page: int, limit: int) -> dict:
    with sqlite3.connect('quotes/stocks.sqlite3') as connection:
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM stocks')
        total_amount = len(cursor.fetchall())
        cursor.close()
        pages_amount = (total_amount // limit) + 1 if \
            (total_amount % limit) else (total_amount // limit)
        if current_page <= 0 or current_page > pages_amount:
            raise Http404('The page with this number does not exist.')
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
