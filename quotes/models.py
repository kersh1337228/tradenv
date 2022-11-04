from django.db import models
from django.http import Http404
from django.core import validators as val
import datetime
import time
import requests
import pandas as pd
import aiohttp
from . import indicators as ind


class DataFrameField(models.JSONField):  # Custom field to store quotes as pandas.DataFrame
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def from_db_value(self, value: None | str, expression, connection):
        if not value:
            return pd.DataFrame()
        return pd.read_json(
            super().from_db_value(value, expression, connection)
        )

    def to_python(self, value: pd.DataFrame | None | str):
        if isinstance(value, pd.DataFrame):
            return value
        if not value:
            return pd.DataFrame()
        return pd.DataFrame(super().to_python(value))

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

    # API key for alpha_vantage api
    api_key = 'J7JRRVLFS9HZFPBY'

    async def update_quotes(self):  # Getting fresh data on stock quotes
        async with aiohttp.ClientSession() as session:  # Establishing request session
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
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, '
                                      'like Gecko) Chrome/91.0.4472.124 Safari/537.36 '
                    },
                    timeout=300
            ) as resp:
                if resp.status == requests.codes.ok:  # Found (likely)
                    try:
                        data = (await resp.json())['chart']['result'][0]  # Selecting only data necessary (no metadata)
                        prices = pd.DataFrame(  # Creating pandas DataFrame to ensure right future json formatting
                            index=pd.to_datetime(data['timestamp'], unit="s").normalize(),
                            data=data['indicators']['quote'][0]
                        ).loc[:, ('open', 'high', 'low', 'close', 'volume')]
                        await StockQuotes.objects.filter(  # Asynchronously updating quotes
                            symbol=self.symbol
                        ).aupdate(quotes=prices.to_json())
                    except KeyError or IndexError:  # No data returned despite code 200 (unlikely)
                        raise KeyError(f'Error occurred during parsing symbol: {self.symbol}')
                else:  # Not found (unlikely)
                    raise Http404(f'No data for such symbol: {self.symbol}')

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
        return quotes.transpose().to_dict()

    def get_moving_averages(  # Moving Averages values for stock specified
            self,
            range_start: str = None,
            range_end: str = None,
            period_length: int = 200,
            price: str = 'close',
            _type: str = 'sma'
    ) -> dict:
        return {
            'name': _type,
            'displayed_name': f'{_type} {period_length} {price}',
            'args': {
                'period_length': period_length,
                'price': price
            },
            'data': pd.Series(
                data={
                    'sma': ind.sma,
                    'ema': ind.ema,
                    'vwma': ind.wma(self.quotes['volume'].to_numpy()),
                }[_type](self.quotes, price, period_length),
                index=self.quotes.index
            )[slice(range_start, range_end)].tolist(),
            'style': {
                'color': 'rgba(0, 0, 0, 1)'  # CSS format color
            },
            'active': True,
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
