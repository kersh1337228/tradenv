import requests
from django.db import models
import datetime
import pandas
from functools import reduce


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

    # Returns closest quotes on date
    def __try_get_quotes(self, date):
        quotes = self.quotes.get(date.strftime('%Y-%m-%d'), None)
        return quotes if quotes else self.__try_get_quotes(date - datetime.timedelta(days=1))

    # Returns quotes for certain period
    def get_quotes_for_range(self, range_start: datetime.date, range_end: datetime.date, type: str ='standard') -> dict:
        return dict(list(self.quotes.items())[
            list(self.quotes).index(range_start.strftime('%Y-%m-%d')) : list(self.quotes).index(range_end.strftime('%Y-%m-%d')) + 1
        ]) if type == 'standard' else {
            date: self.__try_get_quotes(date)
            for date in pandas.date_range(range_start, range_end)
        }
    # Method to parse quotes of the instrument by its symbol
    # and then create a database note and model instance
    @staticmethod
    def add_quote_by_symbol(symbol: str, name: str, slug: str, period: str = 'DAILY'):
        # Parsing quotes data
        meta_data, data = requests.get(
            url='https://www.alphavantage.co/query',
            params={
                'function': f'TIME_SERIES_{period}',
                'symbol': symbol,
                'outputsize': 'full',
                'datatype': 'json',
                'apikey': Quotes.api_key,
            }
        ).json().values()
        quotes = last = {}  # Formatting quotes
        for date in pandas.date_range(
            start=datetime.datetime.strptime(list(data)[-1], '%Y-%m-%d'),
            end=datetime.datetime.strptime(list(data)[0], '%Y-%m-%d'),
            freq='D'
        ):
            key = date.strftime('%Y-%m-%d')
            if data.get(key, None):
                last = {
                    'open': float(data[key]['1. open']),
                    'high': float(data[key]['2. high']),
                    'low': float(data[key]['3. low']),
                    'close': float(data[key]['4. close']),
                    'volume': int(data[key]['5. volume']),
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

    # Returns last day and the day before difference
    def get_tendency(self) -> dict:
        last_date = list(self.quotes)[-1]
        last = self.quotes.get(last_date)
        last.update({'date': last_date})
        return {
            'change': round(last['close'] - last['open'], 2),
            'change_percent': round(
                (last['close'] / last['open'] - 1) * 100, 2
            ) if last['open'] != 0 else 'Zero opening price',
            'quotes': last
        }

    # Returns list of weighted moving averages lagging technical indicator values with selected parameters
    def get_moving_averages(
            self,
            range_start : str,
            range_end : str,
            period_length : int=200,
            price : str='close',
            type : str='SMA'
    ) -> dict:
        print(range_start, range_end, period_length, price, type)
        # Preparing quotes data to by-index access
        dates = list(self.quotes)
        start, end = dates.index(range_start), dates.index(range_end)
        # Quotes work range
        period_quotes = list(self.quotes.values())
        result = []
        while (start - period_length + 1 < 0):
            result.append(None)
            start += 1
        match type:
            case 'SMA':
                result.append(reduce(  # Initial value in null point (date = start)
                    lambda part_sum, next: part_sum + next[price],
                    period_quotes[start - period_length + 1 : start + 1], 0
                ) / period_length)
                for date in range(start + 1, end + 1):
                    result.append(  # Iteration formula based
                        result[-1] + (
                            period_quotes[date][price] -
                            period_quotes[date - period_length][price]
                        ) / period_length
                    )  # SMA(i,n) = SMA(i-1, n) + (P(i) - P(i-n))/n
            case 'EMA':  # EMA
                smoothing_factor = 1 - 2 / (period_length + 1)
                result.append(  # Initial value in null point (date = start)
                    sum([pow(smoothing_factor, start - k) / (1 - smoothing_factor) *
                         period_quotes[start][price]
                         for k in range(start - period_length + 1, start + 1)]) /
                    sum([pow(smoothing_factor, start - k) / (1 - smoothing_factor)
                         for k in range(start - period_length + 1, start + 1)])
                )
                for date in range(start + 1, end + 1):
                    result.append(  # Iteration formula based
                        (1 - smoothing_factor) * period_quotes[date][price] + smoothing_factor * result[-1]
                    )  # EMA(i,n) = 2/(n+1) * P(i) + (1 - 2/(n+1)) * EMA(i-1,n)
            case 'volumetric':  # VMA
                pass
        return {
            'name': type,
            'displayed_name': f'{type} {period_length} {price}',
            'args': {
                'period_length': period_length,
                'price': price
            },
            'data': result
        }

    @staticmethod
    def get_indicators_list():
        return [
            {
                'name': 'SMA',
                'displayed_name': 'SMA 200 close',
                'args': {
                    'period_length': 200,
                    'price': 'close'
                }
            },
            {
                'name': 'EMA',
                'displayed_name': 'EMA 200 close',
                'args': {
                    'period_length': 200,
                    'price': 'close'
                }
            }
        ]

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
    amount = models.PositiveSmallIntegerField()
