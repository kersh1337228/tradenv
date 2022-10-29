import csv, datetime, time, requests, os, json, asyncio, aiohttp
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotes_analysis.settings')
import django
django.setup()
from django.http import Http404
from quotes.models import StockQuotes
import pandas as pd


async def parse_quote_by_symbol(session: aiohttp.ClientSession, symbol: str, name: str):
    print(f'Symbol: {symbol}\tName: {name}')
    async with session.get(
        url=f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}',
        params={
            'period1': 0,
            'period2': int(time.mktime(datetime.datetime.now().timetuple())),
            'interval': '1d',
            'frequency': '1d',
            'events': 'history'
        },
        headers={
            'Connection': 'keep-alive',
            'Expires': '-1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout=300
    ) as resp:
        if resp.status == requests.codes.ok:
            try:
                data = (await resp.json())['chart']['result'][0]
                prices = pd.DataFrame(
                    index=pd.to_datetime(data['timestamp'], unit="s").normalize(),
                    data=data['indicators']['quote'][0]
                ).loc[:, ('open', 'high', 'low', 'close', 'volume')]
                await StockQuotes.objects.acreate(
                    name=name,
                    symbol=symbol,
                    quotes=prices.to_json()
                )
            except KeyError or IndexError:
                print(f'Error occurred during parsing symbol: {symbol}')
        else:
            print(f'No data for such symbol: {symbol}')


# Parsing quotes names, symbols and etc.
async def parse_quotes_names() -> None:
    async with aiohttp.ClientSession() as session:
        async with session.get(  # Sending api request to get .csv response
            url='https://www.alphavantage.co/query?',
            params={
                'function': 'LISTING_STATUS',
                'apikey': StockQuotes.api_key,
            }
        ) as response:
            if response.status == requests.codes.ok:  # Checking if the response is successful
                rows = csv.reader(  # Decoding and serializing csv
                    (await response.text('utf-8')).splitlines(),
                    delimiter=','
                )
                next(rows)  # Moving to next line to skip header row
            else:
                raise Exception(
                    f'Parsing error. Http response '
                    f'status code is {response.status}'
                )
        await asyncio.gather(
            *(asyncio.ensure_future(
                parse_quote_by_symbol(session, row[0], row[1])
            ) for row in rows)
        )


def paginate(current_page: int, limit: int) -> dict:  # Paginate quotes list pages
    total_amount = StockQuotes.objects.count()
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


if __name__ == '__main__':
    # asyncio.run(parse_quotes_names())
    pass
