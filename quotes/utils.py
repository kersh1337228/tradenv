import csv
import datetime
import re
import requests
from django.http import Http404
import django
django.setup()
from quotes import models
from quotes.models import Quotes
import multiprocessing
import pandas_datareader.yahoo.daily
import pandas_datareader._utils


def parse_quote_by_symbol(symbol: str, name: str) -> tuple[str, str, dict] | None:
    try:
        daily_reader = pandas_datareader.yahoo.daily.YahooDailyReader(
            symbols=symbol,
            start=datetime.datetime(1980, 1, 1),
            end=datetime.datetime.now(),
        )
        data = daily_reader.read()
        quotes = {
            date: {
                'open': data.loc[date]['Open'],
                'high': data.loc[date]['High'],
                'low': data.loc[date]['Low'],
                'close': data.loc[date]['Close'],
                'volume': data.loc[date]['Volume'],
            } for date in data.index.strftime('%Y-%m-%d')
        }
        Quotes.objects.create(
            name=name,
            symbol=symbol,
            quotes=quotes,
            slug=re.sub('[\W]+', '_', name.lower()),
        )
        daily_reader.close()
        return symbol, name, quotes
    except pandas_datareader._utils.RemoteDataError:
        print(f'Error occurred during quotes parsing. No data for such symbol: {symbol}')
    except:
        print('Unknown error occurred during quotes parsing.')


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
        with multiprocessing.Pool(multiprocessing.cpu_count()) as pool:
            pool.starmap(
                parse_quote_by_symbol,
                [(row[0], row[1]) for row in rows]
            )
            pool.close()
            pool.join()
    else:
        print(f'Parsing error. Http response status code is {response.status_code}')


# Paginate quotes list pages
def paginate(current_page: int, limit: int) -> dict:
    total_amount = Quotes.objects.count()
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
