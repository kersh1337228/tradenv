from django.db import models
from django.core import validators as val
import datetime
import time
import numpy as np
import pandas as pd
import aiohttp
from . import indicators
from asgiref.sync import sync_to_async
import asyncio
from django.utils import timezone


class DataFrameField(models.JSONField):  # Custom field to store quotes as pandas.DataFrame
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def from_db_value(self, value: None | str, expression, connection):
        if not value:
            return pd.DataFrame()
        return pd.read_json(
            super().from_db_value(value, expression, connection)
        ).fillna(0.)

    def to_python(self, value: pd.DataFrame | None | str):
        if isinstance(value, pd.DataFrame):
            return value
        if not value:
            return pd.DataFrame()
        return pd.DataFrame(
            super().to_python(value)
        ).fillna(0.)

    def get_prep_value(self, value: pd.DataFrame):
        return super().get_prep_value(value.to_json())


class StockQuotes(models.Model):  # Economic market instrument information storage.
    symbol = models.CharField(
        max_length=255,
        unique=True,
        blank=False,
        null=False,
        primary_key=True,
        db_index=True
    )
    name = models.CharField(
        max_length=255,
        unique=False,
        blank=True,
        null=True
    )
    quotes = DataFrameField(
        blank=False,
        null=False
    )
    type = models.CharField(
        max_length=7,
        blank=False,
        null=False,
        choices=[
            ('stock', 'Stock'),
            ('etf', 'ETF'),
            ('bond', 'Bond'),
            ('option', 'Option'),
            ('futures', 'Futures'),
            ('forex', 'FOREX')
        ],
        default='stock'
    )
    country = models.CharField(
        max_length=20,
        blank=False,
        null=False,
        default='USA'
    )
    exchange = models.CharField(
        max_length=100,
        blank=False,
        null=False,
        default='NASDAQ'
    )
    last_updated = models.DateTimeField(
        auto_now_add=True
    )

    # API key for alpha_vantage api
    api_key = 'J7JRRVLFS9HZFPBY'

    @property  # Last available quotes date
    def last_timestamp(self):
        return self.quotes.index[-1].strftime('%Y/%m/%d')

    async def update_quotes(self, session: aiohttp.ClientSession):  # Refreshing stock quotes
        if self.last_updated.date() != datetime.date.today():  # Check if updated recently
            try:
                async with session.get(  # Making get request
                        url=f'https://query1.finance.yahoo.com/v8/finance/chart/{self.symbol}',
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
                        timeout=300  # Bigger timeout for
                ) as resp:
                    if resp.status == 200:
                        try:
                            data = (await resp.json())['chart']['result'][0]  # Selecting only data necessary (no metadata)
                            prices = pd.DataFrame(
                                index=pd.to_datetime(data['timestamp'], unit='s').normalize(),
                                data=data['indicators']['quote'][0]
                            ).loc[:, ('open', 'high', 'low', 'close', 'volume')]
                            self.quotes = prices
                            self.last_updated = timezone.now()
                            await sync_to_async(self.save)()
                        except KeyError or IndexError:  # No data returned despite code 200
                            print(
                                f'Error occurred during quotes update '
                                f'attempt for symbol: {self.symbol}'
                            )
                        except ValueError:
                            print(f'Wrong timeframe format for symbol: {self.symbol}.')
                    else:
                        print(
                            f'No data found during quotes update '
                            f'attempt for symbol: {self.symbol}'
                        )
            except asyncio.TimeoutError:
                print(
                    f'Timeout limit exceeded during quotes '
                    f'update attempt for symbol: {self.symbol}'
                )

    # Returns last day and the day before difference
    def get_tendency(self) -> dict:
        last = self.quotes.iloc[-1].copy()
        last['date'] = self.quotes.index[-1].strftime('%Y-%m-%d')
        return {
            'change': round(last['close'] - last['open'], 2),
            'change_percent': round(
                (last['close'] / last['open'] - 1) * 100, 2
            ) if last['open'] != 0 else 'Zero opening price',
            'quotes': last.to_dict()
        }

    def get_quotes(self) -> dict:
        quotes = self.quotes  # Quotes serialization to JSON
        quotes.index = quotes.index.strftime('%Y-%m-%d')
        return quotes.rename_axis('date').reset_index().to_dict('records')

    def get_indicator(  # Indicator data wrapper
            self,
            alias: str,
            range_start: str | datetime.datetime | pd.Timestamp | np.datetime64,
            range_end: str | datetime.datetime | pd.Timestamp | np.datetime64,
            args: dict
    ) -> dict:
        indicator = next(filter(  # Selecting indicator description
            lambda i: i['alias'] == alias,
            indicators.choices
        ))
        for arg, dtype in indicator['args'].items():
            match dtype:
                case 'int':
                    args[arg] = int(args[arg])
                case 'float':
                    args[arg] = float(args[arg])
                case 'str':
                    args[arg] = str(args[arg])
                case 'list[int]':
                    args[arg] = [int(args.pop(key)) for key in tuple(args.keys()) if arg in key]
                case 'list[float]':
                    args[arg] = [float(args.pop(key)) for key in tuple(args.keys()) if arg in key]
        data = getattr(indicators, alias)(  # Calculating
            self.quotes, **args
        )[slice(range_start, range_end)]
        data.index = data.index.strftime('%Y-%m-%d')  # TimeStamp to datetime-string
        return {
            'verbose_name': ' '.join((alias,) + tuple(map(str, args.values()))),
            'alias': alias,
            'args': args,
            'data': data.to_dict('list')
        }

    def __str__(self):
        return self.name


class StockInstance(models.Model):  # Stock model used to create portfolios
    quotes = models.ForeignKey(  # Linking model storing quotes of stock
        StockQuotes,
        on_delete=models.CASCADE,
        related_name='stock_quotes'
    )  # Current amount in the portfolio
    amount = models.PositiveSmallIntegerField(
        validators=[
            val.MinValueValidator(1),
        ],
        default=1,
        null=False
    )  # Stock priority => higher priority - first being taken into consideration
    priority = models.PositiveSmallIntegerField(
        validators=[
            val.MinValueValidator(1),
        ],
        null=False
    )
