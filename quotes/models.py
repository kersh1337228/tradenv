import requests
from django.core.files import File
from django.db import models
import os
import datetime
import pandas


'''Economic market instrument, representing shares,
 obligations, currencies, etc. 
 Contains symbol, main quotes for certain period, price plot.'''
class Quote(models.Model):
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
    price_plot = models.ImageField(
        upload_to='plots'
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=False,
        null=False
    )

    # API key for alpha_vantage api
    api_key = 'J7JRRVLFS9HZFPBY'

    # Method to parse quotes of the instrument by its symbol
    # and then create a database note and model instance
    @staticmethod
    def add_quote_by_symbol(symbol, name, slug, period='DAILY'):
        # Parsing quotes data
        data = requests.get(f'''https://www.alphavantage.co/query?
        function=TIME_SERIES_{period}&
        symbol={symbol}&
        outputsize=full&
        datatype=json&
        apikey={Quote.api_key}''').json()
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
        quote = Quote.objects.create(
            symbol=symbol,
            name=name,
            quotes=quotes,
            slug=slug
        )  # Building ohlc quotes plot
        quote.build_price_plot()
        return quote

    # Building price ohlc plot of the instrument using its quotes
    def build_price_plot(self):
        build_candle_plot(self.quotes)
        self.price_plot.save(
            f'{self.slug}_price_plot.png',
            File(open('ui/business_logic/plot.png', 'rb'))
        )  # Attaching plot image
        # Deleting unnecessary plot picture
        os.remove(f'ui/business_logic/plot.png')
        self.save()

    def __str__(self):
        return self.name


'''Share model used to create portfolios'''
class Share(models.Model):
    # Link to the original instrument model
    origin = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='share_origin'
    )
    # Amount of quotes in the portfolio
    amount = models.IntegerField()
