import sqlite3
import requests
from bs4 import BeautifulSoup
from django.http import Http404
# from quotes.models import Quotes
import multiprocessing
import asyncio
import aiohttp


# Global parse variables (constants)
url = 'https://yfapi.net/ws/screeners/v1/finance/screener/predefined/saved'
headers = {
    'x-api-key': 'y9mFKgp6vk8DuOYD9ZWMk2lS3vnSW6j766S598wE',
    'accept': 'application/json',
}
params = {
    'count': '100',
    'scrIds': 'day_gainers',
}


def test(response):
    print(response)


async def parse_coroutine(page: int, session: aiohttp.ClientSession) -> list:
    async with session.get(url, headers=headers, params=params) as response:
        html = BeautifulSoup(await response.text(), 'html.parser')
        print(html.find_all('tr'))
        items = html.find_all('tr', class_='simpTblRow Bgc($hoverBgColor):h BdB Bdbc($seperatorColor) Bdbc($tableBorderBlue):h H(32px) Bgc($lv1BgColor)')
        return [{
            'symbol': item.find('td', attrs={'aria-label': 'Symbol'}).get_text(),
            'name': item.find('td', attrs={'aria-label': 'Name'}).get_text(),
            'price': item.find('td', attrs={'aria-label': 'Price (Intraday)'}).get_text(),
            'change': item.find('td', attrs={'aria-label': 'Change'}).get_text(),
            'change_percent': item.find('td', attrs={'aria-label': '% Change'}).get_text(),
            'volume': item.find('td', attrs={'aria-label': 'Volume'}).get_text(),
        } for item in items]


async def parse_gather(pages):
    async with aiohttp.ClientSession() as session:
        tasks = []
        [tasks.append(
            asyncio.create_task(parse_coroutine(page, session))
        ) for page in range(*pages)]
        return await asyncio.gather(*tasks)


def parse_pages(pages: tuple) -> list:
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    data = asyncio.run(parse_gather(pages))
    return data

# Parsing quotes names, symbols and etc.
def parse_quotes_names(pages_amount: int = 50) -> None:
    # Creating jobs for concurrent execution
    threads_amount = multiprocessing.cpu_count()
    pages_per_process = int(pages_amount / threads_amount)
    pages_left = pages_amount % threads_amount
    jobs = []
    first_page = 0
    for _ in range(threads_amount):
        job_pages_amount = pages_per_process + 1 if pages_left else pages_per_process
        if job_pages_amount:
            jobs.append((first_page, first_page + job_pages_amount))
        else:
            break
        pages_left -= 1
        first_page += job_pages_amount
    # Test request to check for exceptions
    response = requests.get(url, headers=headers, params={})
    if response.status_code == 200:
        # Initializing process pool
        with multiprocessing.Pool(threads_amount) as pool:
            pool.map_async(parse_pages, jobs, callback=test)
            pool.close()
            pool.join()
    else:
        raise Http404(f'Parsing error. Http request status code is {response.status_code}')
    # Creating quotes names database

    # with sqlite3.connect('quotes/names.sqlite3') as connection:
    #     cursor = connection.cursor()
    #     cursor.execute('''DROP TABLE IF EXISTS names''')
    #     cursor.execute(
    #         '''CREATE TABLE IF NOT EXISTS names (
    #         symbol VARCHAR(1024) NOT NULL UNIQUE PRIMARY KEY,
    #         name VARCHAR(1024) NOT NULL,
    #         price VARCHAR(1024) NOT NULL,
    #         change VARCHAR(1024) NOT NULL,
    #         change_percent VARCHAR(1024) NOT NULL,
    #         volume VARCHAR(1024) NOT NULL
    #         )'''
    #     )
    #     for quote in data:
    #         try:
    #             cursor.execute(
    #                 f'''INSERT INTO names (symbol, name, price, change, change_percent, volume) VALUES (
    #                 '{quote['symbol']}', '{quote['name']}', '{quote['price']}',
    #                 '{quote['change']}', '{quote['change_percent']}', '{quote['volume']}'
    #                 )'''
    #             )
    #         except sqlite3.OperationalError:
    #             print('Wrong name format')
    #             continue
    #     cursor.close()


# # Return quotes of instruments with matching name or symbol
# def quote_name_search(keyword):
#     with sqlite3.connect('quotes/names.sqlite3') as connection:
#         cursor = connection.cursor()
#         cursor.execute(f'''
#             SELECT * FROM names WHERE name LIKE "{keyword}%" OR symbol LIKE "{keyword}%"
#         ''')
#         quotes = [{
#             'symbol': result[0],
#             'name': result[1],
#             'price': result[2],
#             'change': result[3],
#             'change_percent': result[4],
#             'volume': result[5],
#             'slug': result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
#             'downloaded': Quotes.objects.filter(
#                 slug=result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_')
#             ).exists()
#         } for result in cursor.fetchall()]
#         cursor.close()
#         return quotes


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


if __name__ == '__main__':
    resp = requests.get(url, headers=headers, params=params)
    print(resp.json())
    # parse_quotes_names(70)
    # parse_pages((0, 5))
