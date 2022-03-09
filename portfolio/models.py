from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
import datetime
import pandas


# Portfolio class containing stocks and balance
class Portfolio(models.Model):
    name = models.CharField(
        max_length=255,
        blank=False,
        unique=True,
    )
    balance = models.FloatField(
        validators=[
            MinValueValidator(0.0),
            MaxValueValidator(100000000.0)
        ]
    )
    stocks = models.ManyToManyField(
        'quotes.Stock',
        related_name='portfolio_stocks',
    )
    created = models.DateTimeField(
        auto_now_add=True
    )
    last_updated = models.DateTimeField(
        auto_now=True,
    )
    slug = models.SlugField(
        max_length=255,
        blank=False,
        null=False,
        unique=True,
    )

    # Returns the first and the last dates available in quotes
    # to analyse portfolios with multiple different instruments
    def get_quotes_dates(self):
        return pandas.date_range(
            max([datetime.datetime.strptime(
                list(stock.origin.quotes.keys())[0],
                '%Y-%m-%d'
            ) for stock in self.stocks.all()]),
            min([datetime.datetime.strptime(
                list(stock.origin.quotes.keys())[-1],
                '%Y-%m-%d'
            ) for stock in self.stocks.all()])
        ).strftime('%Y-%m-%d').tolist()

    def __str__(self):
        return self.name
