import requests
from django.db import models
import datetime
import pandas


'''Economic market instrument, representing stocks,
 obligations, currencies, etc. 
 Contains symbol, main quotes for certain period, price plot.'''


class Quotes(models.Model):
    symbol = models.CharField(
        max_length=255,
        unique=True,
        blank=False,
        null=False
    )
    name = models.CharField(
        max_length=255,
        unique=True,
        blank=False,
        null=False
    )
    quotes = models.JSONField()
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=False,
        null=False
    )

    # API key for alpha_vantage api
    api_key = 'J7JRRVLFS9HZFPBY'

    # Returns quotes only for certain period
    def get_quotes_for_period(self, period_start, period_end):
        date_range = pandas.date_range(
            datetime.datetime.strptime(
                period_start,
                '%Y-%m-%d'
            ),
            datetime.datetime.strptime(
                period_end,
                '%Y-%m-%d'
            ),
        )
        return {date: quotes for date, quotes in enumerate(self.quotes) if date in date_range}

    # Method to parse quotes of the instrument by its symbol
    # and then create a database note and model instance
    @staticmethod
    def add_quote_by_symbol(symbol, name, slug, period='DAILY'):
        # Parsing quotes data
        data = requests.get('https://www.alphavantage.co/query?' +
                            f'function=TIME_SERIES_{period}&' +
                            f'symbol={symbol}&' +
                            'outputsize=full&' +
                            'datatype=json&' +
                            f'apikey={Quotes.api_key}').json()
        data = data[list(data.keys())[-1]]
        quotes = last = {}  # Formatting quotes
        for date in pandas.date_range(
            start=datetime.datetime.strptime(list(data.keys())[-1], '%Y-%m-%d'),
            end=datetime.datetime.strptime(list(data.keys())[0], '%Y-%m-%d'),
            freq='D'
        ):
            key = date.strftime('%Y-%m-%d')
            if data.get(key, None):
                last = {
                    'open': float(data[key]['1. open']),
                    'high': float(data[key]['2. high']),
                    'low': float(data[key]['3. low']),
                    'close': float(data[key]['4. close']),
                    'volume': float(data[key]['5. volume']),
                    'non-trading': False
                }
            else:
                last['non-trading'] = True
            quotes[key] = last
        # Adding quotes data to the database
        quote = Quotes.objects.create(
            symbol=symbol,
            name=name,
            quotes=quotes,
            slug=slug
        )  # Building ohlc quotes plot
        return quote

    def __str__(self):
        return self.name


# Stock model used for create portfolios
class Stock(models.Model):
    # Link to the original instrument model
    origin = models.OneToOneField(
        Quotes,
        on_delete=models.CASCADE,
        related_name='stock_origin'
    )  # Current amount of stocks in the portfolio
    amount = models.IntegerField()
