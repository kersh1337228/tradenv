import asyncio
import csv
import aiohttp
from src.utils.contstants import http_headers
from src.apps.stocks.models import Stock


types = {
    'EQUITY': 'stock',
    'ETF': 'etf',
    'MUTUALFUND': 'fund',
    'FUTURE': 'futures',
    'CURRENCY': 'forex',
    'INDEX': 'index',
    'BOND': 'bond',
    'OPTION': 'option',
    'CRYPTOCURRENCY': 'crypto'
}


async def search(
        session: aiohttp.ClientSession,
        symbol: str
) -> dict:
    try:
        async with session.get(
                url='https://query2.finance.yahoo.com/v1/finance/search?',
                params={
                    'q': symbol
                },
                headers=http_headers,
                timeout=300
        ) as response:
            match = (await response.json()).get(
                'quotes',
                [{}]
            )[0]
            return {
                'name': match.get('longname'),
                'type': types.get(match.get('quoteType', 'EQUITY')),
                'exchange': match.get('exchange'),
                'exchange_name': match.get('exchDisp'),
                'sector': match.get('sectorDisp'),
                'industry': match.get('industryDisp')
            }
    except Exception as exc:
        print(exc)
        print(f'Search error for {symbol}')
        return {}


async def chart(
        session: aiohttp.ClientSession,
        symbol: str
) -> dict:
    async with session.get(
            url=f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}',
            headers=http_headers,
            timeout=300
    ) as response:
        meta = (await response.json()).get(
            'chart',
            {'result': []}
        ).get(
            'result',
            [{'meta': {}}]
        )[0].get(
            'meta',
            {}
        )
        return {
            'type': types.get(meta.get('instrumentType', 'EQUITY')),
            'currency': meta.get('currency', 'USD') or 'USD',
            'exchange': meta.get('exchangeName'),
            'exchange_name': meta.get('fullExchangeName'),
            'timezone': meta.get('exchangeTimezoneName')
            # 'timezone': meta.get('timezone'),
            # 'gmtoffset': meta.get('gmtoffset')
        }


async def parse(
        session: aiohttp.ClientSession,
        symbol: str,
        name: str,
        exchange: str,
        country: str
) -> None:
    try:
        async with asyncio.TaskGroup() as tg:
            chart_task = tg.create_task(
                chart(
                    session=session,
                    symbol=symbol
                )
            )
            search_task = tg.create_task(
                search(
                    session=session,
                    symbol=symbol
                )
            )
    except Exception as exc:
        print(exc)
        print(f'Chart error for {symbol}')
        return

    await Stock.objects.acreate(**(
        {
           'symbol': symbol,
           'name': name,
           'exchange': exchange,
           'country': country
        } | chart_task.result() | search_task.result()
    ))


async def stock_index() -> None:
    async with aiohttp.ClientSession() as session:
        async with asyncio.TaskGroup() as tg:
            with open(
                    file='index.csv',
                    mode='r',
                    newline=''
            ) as index:
                reader = csv.reader(
                    index,
                    delimiter=','
                )
                next(reader)
                for symbol, name, exchange, _, country in reader:
                    tg.create_task(
                        parse(
                            session=session,
                            symbol=symbol,
                            name=name,
                            exchange=exchange,
                            country=country
                        )
                    )
