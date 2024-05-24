from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from typing import Literal
import numpy as np
import pandas as pd
import datetime
import re


# Portfolio class containing stocks and balance
class Portfolio(models.Model):
    name = models.CharField(
        max_length=255,
        blank=False,
        unique=True,
    )
    balance = models.FloatField(
        validators=[
            MinValueValidator(0.),
            MaxValueValidator(100000000.)
        ]
    )
    stocks = models.ManyToManyField(
        'quotes.StockInstance',
        related_name='portfolio_stocks',
        blank=True,
    )
    # Stops and limits
    long_limit = models.PositiveSmallIntegerField(  # Max simultaneously open longs amount
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ],
        default=None,
        null=True,
        blank=True
    )
    short_limit = models.PositiveSmallIntegerField(  # Max simultaneously open shorts amount
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ],
        default=None,
        null=True,
        blank=True
    )
    buy_stop = models.FloatField(  # Buy here or higher
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    sell_stop = models.FloatField(  # Sell here or lower
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    buy_limit = models.FloatField(  # Buy here or lower
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    sell_limit = models.FloatField(  # Sell here or higher
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    stop_loss = models.FloatField(  # Close position here or worse
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    take_profit = models.FloatField(  # Close position here or better
        validators=[
            MinValueValidator(1.)
        ],
        default=None,
        null=True,
        blank=True
    )
    # Meta data
    created = models.DateTimeField(
        auto_now_add=True,
        editable=False
    )
    last_updated = models.DateTimeField(
        auto_now=True,
    )
    slug = models.SlugField(
        max_length=255,
        null=False,
        unique=True,
        db_index=True
    )

    def save(  # Custom save method to autogenerate slug from name
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        self.slug = re.sub(r'[.\- ]+', '_', self.name.strip().lower())
        super().save(force_insert, force_update, using, update_fields)

    # Returns the earliest and latest dates available for stocks chosen
    async def get_quotes_dates(self) -> pd.DatetimeIndex:
        starts_n_ends = np.array(  # Selecting first and last date for all stocks
            [stock.quotes.quotes.index[[0, -1]]
                async for stock in self.stocks.select_related('quotes')],
            pd.Timestamp
        )
        return pd.date_range(
            starts_n_ends[:, 0].max(axis=0),
            starts_n_ends[:, 1].min(axis=0)
        )

    async def get_all_quotes(  # Get portfolio stocks quotes for certain period
            self,
            range_start: datetime.date | pd.Timestamp | np.datetime64 | str = None,
            range_end: datetime.date | pd.Timestamp | np.datetime64 | str = None,
            _format: Literal['dataframe', 'dict'] = 'dataframe',  # Return format
            _fill: bool = False  # Fill days with no data
    ) -> pd.DataFrame | dict:
        if _fill:  # Creating date range to fill blank days
            if not range_start or not range_end:
                quotes_dates = await self.get_quotes_dates()
            date_range = pd.date_range(
                range_start if range_start else quotes_dates[0],
                range_end if range_end else quotes_dates[-1]
            )
            all_quotes = {
                stock.quotes.symbol:
                    stock.quotes.quotes.reindex(
                        pd.date_range(
                            stock.quotes.quotes.index[0],
                            stock.quotes.quotes.index[-1]
                        )
                    ).ffill().reindex(date_range)
                async for stock in self.stocks.order_by('priority').select_related('quotes')
            }
        else:  # Just making DateTimeIndex slice
            all_quotes = {
                stock.quotes.symbol:
                    stock.quotes.quotes[slice(range_start, range_end)]
                async for stock in self.stocks.order_by('priority').select_related('quotes')
            }
        match _format:
            case 'dataframe':
                return pd.concat(
                    objs=all_quotes.values(),
                    axis=0,
                    keys=all_quotes.keys()
                )
            case 'dict':
                def dict_format(df):
                    df.index = df.index.strftime('%Y-%m-%d')
                    return df.rename_axis('date').reset_index().to_dict('records')
                return dict(zip(
                    all_quotes.keys(),
                    map(dict_format, all_quotes.values())
                ))

    async def stocks_price_deltas(  # Stocks price changes in percent and currency for selected period
            self,
            range_start: datetime.date | pd.Timestamp | np.datetime64 | str = None,
            range_end: datetime.date | pd.Timestamp | np.datetime64 | str = None,
            price: Literal['open', 'high', 'low', 'close'] = 'close'
    ) -> list[dict]:
        result = []
        async for stock in self.stocks.select_related('quotes'):
            first, last = stock.quotes.quotes.loc[
                slice(range_start, range_end), price
            ][[0, -1]]
            result.append({
                'symbol': stock.quotes.symbol,
                'name': stock.quotes.name,
                'percent': round((last / first - 1) * 100, 2)
                if first else None,
                'currency': round(last - first, 2)
            })
        return result

    async def calculate_investment(  # Balance change for selected period
            self,
            range_start: datetime.date | pd.Timestamp | np.datetime64 | str = None,
            range_end: datetime.date | pd.Timestamp | np.datetime64 | str = None
    ) -> dict:
        result = 0.
        async for stock in self.stocks.select_related('quotes'):
            first, last = stock.quotes.quotes.loc[
                slice(range_start, range_end), 'close'
            ][[0, -1]]
            result += (last - first) * stock.amount
        return {
            'percent': round((result / self.balance) * 100, 2),
            'currency': round(result, 2)
        }

    def __str__(self):
        return self.name
