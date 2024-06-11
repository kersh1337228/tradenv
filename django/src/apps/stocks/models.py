import datetime
from typing import (
    Self,
    Literal,
    TypeAlias,
    override
)
from django.db import models
import numpy as np
import pandas as pd
import aiohttp
from django.http import Http404
from src.utils.contstants import http_headers
from . import indicators
from src.utils.fields import DataFrameField


DateTime: TypeAlias = str | datetime.datetime | pd.Timestamp | np.datetime64 | None
TimeFrame: TypeAlias = Literal[
    '1m', '2m', '5m', '15m', '30m', '60m', '90m',
    '1h', '1d', '5d', '1wk', '1mo', '3mo'
]


timeframes = (
    ('1m', '1m'),
    ('2m', '2m'),
    ('5m', '5m'),
    ('15m', '15m'),
    ('30m', '30m'),
    ('60m', '60m'),
    ('90m', '90m'),
    ('1h', '1h'),
    ('1d', '1d'),
    ('5d', '5d'),
    ('1wk', '1wk'),
    ('1mo', '1mo'),
    ('3mo', '3mo')
)
timeframe_delta = {
    '1m': datetime.timedelta(minutes=1),
    '2m': datetime.timedelta(minutes=2),
    '5m': datetime.timedelta(minutes=5),
    '15m': datetime.timedelta(minutes=15),
    '30m': datetime.timedelta(minutes=30),
    '60m': datetime.timedelta(minutes=60),
    '90m': datetime.timedelta(minutes=90),
    '1h': datetime.timedelta(hours=1),
    '1d': datetime.timedelta(days=1),
    '5d': datetime.timedelta(days=5),
    '1wk': datetime.timedelta(weeks=1),
    '1mo': datetime.timedelta(weeks=4),
    '3mo': datetime.timedelta(weeks=12)
}
timeframe_delta_max = {
    '1m': datetime.timedelta(days=7),
    '2m': datetime.timedelta(days=60),
    '5m': datetime.timedelta(days=60),
    '15m': datetime.timedelta(days=60),
    '30m': datetime.timedelta(days=60),
    '60m': datetime.timedelta(days=730),
    '90m': datetime.timedelta(days=60),
    '1h': datetime.timedelta(days=730)
}
timeframe_format = {
    '1m': '%Y-%m-%d %H:%M',
    '2m': '%Y-%m-%d %H:%M',
    '5m': '%Y-%m-%d %H:%M',
    '15m': '%Y-%m-%d %H:%M',
    '30m': '%Y-%m-%d %H:%M',
    '60m': '%Y-%m-%d %H:%M',
    '90m': '%Y-%m-%d %H:%M',
    '1h': '%Y-%m-%d %H',
    '1d': '%Y-%m-%d',
    '5d': '%Y-%m-%d',
    '1wk': '%Y-%m-%d',
    '1mo': '%Y-%m',
    '3mo': '%Y-%m'
}


class Quotes(models.Model):
    id = models.SlugField(
        max_length=21,
        primary_key=True
    )
    stock = models.ForeignKey(
        'Stock',
        on_delete=models.CASCADE
    )
    ohlcv = DataFrameField()
    timeframe = models.CharField(
        max_length=3,
        choices=timeframes
    )
    update_time = models.DateTimeField(
        auto_now=True
    )

    async def update_quotes(
            self: Self
    ) -> None:
        if datetime.datetime.now() - self.update_time > timeframe_delta[self.timeframe]:
            try:
                now = datetime.datetime.now()
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                            url=f'https://query1.finance.yahoo.com/v8/finance/chart/{self.symbol}',
                            params={
                                'period1': int((now - timeframe_delta_max.get(self.timeframe)).timestamp())
                                if self.timeframe in timeframe_delta_max else 0,
                                'period2': int(now.timestamp()),
                                'interval': self.timeframe,
                                'events': 'history'
                            },
                            headers=http_headers,
                            timeout=300
                    ) as response:
                        data = await response.json()
                chart = data['chart']['result'][0]

                new = pd.DataFrame(
                    # TODO: consider timezone (pytz)
                    index=pd.to_datetime(
                        arg=chart['timestamp'],
                        unit='s'
                    ),
                    data=chart['indicators']['quote'][0]
                )
                self.ohlcv = self.ohlcv.reindex(self.ohlcv.index.union(new.index))
                self.ohlcv.loc[new.index] = new

                await self.asave()
            except Exception as exc:
                print(
                    response, exc,
                    f'Update error for {self.symbol} on {self.timeframe} timeframe',
                    sep='\n\n'
                )

    def indicator(
            self: Self,
            name: str,
            params: dict,
            range_start: DateTime = None,
            range_end: DateTime = None
    ) -> dict:
        indicator_object = getattr(indicators, name)
        if indicator_object is None:
            raise Http404(f'No indicator with name {name}.')

        data = indicator_object(
            self.ohlcv, **params
        ).loc[range_start:range_end]

        return {
            'name': name,
            'params': params,
            'verbose_name': f'{name} ({'; '.join(map(
                lambda param: f'{param[0]}: {param[1]}',
                params.items()
            ))})',
            'data': {
                key: value.to_frame().reset_index(
                    names='timestamp'
                )[['timestamp', key]].values.tolist()
                for key, value in data.set_index(
                    data.index.strftime(
                        timeframe_format[self.timeframe]
                    )
                ).to_dict('series').items()
            }
        }

    @override
    def save(
            self: Self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ):
        if not self.pk:
            self.id = f'{self.stock.symbol}_{self.timeframe}'

        super().save(
            force_insert,
            force_update,
            using,
            update_fields
        )

    class Meta:
        get_latest_by = 'update_time'
        ordering = (
            'update_time',
        )
        unique_together = (
            'stock',
            'timeframe'
        )


class Stock(models.Model):
    symbol = models.CharField(
        max_length=17,
        primary_key=True
    )
    name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True
    )
    type = models.CharField(
        max_length=7,
        choices=(
            ('stock', 'Stock'),
            ('etf', 'ETF'),
            ('fund', 'Mutual Fund'),
            ('futures', 'Futures'),
            ('forex', 'Currency'),
            ('index', 'Index'),
            ('bond', 'Bond'),
            ('option', 'Option'),
            ('crypto', 'Crypto')
        ),
        default='stock'
    )
    exchange = models.CharField(
        max_length=3,
        blank=True,
        null=True
    )
    exchange_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    timezone = models.CharField(
        max_length=32,
        default='America/New_York'
    )
    country = models.CharField(
        max_length=14,
        default='USA'
    )
    currency = models.CharField(
        max_length=3,
        default='USD'
    )
    sector = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    industry = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    async def parse_quotes(
            self: Self,
            timeframe: TimeFrame
    ):
        quotes = Quotes.objects.filter(
            stock=self,
            timeframe=timeframe
        )
        if await quotes.aexists():
            return await quotes.afirst()

        try:
            now = datetime.datetime.now()
            async with aiohttp.ClientSession() as session:
                async with session.get(
                        url=f'https://query1.finance.yahoo.com/v8/finance/chart/{self.symbol}',
                        params={
                            'period1': int((now - timeframe_delta_max.get(timeframe)).timestamp())
                            if timeframe in timeframe_delta_max else 0,
                            'period2': int(now.timestamp()),
                            'interval': timeframe,
                            'events': 'history'
                        },
                        headers=http_headers,
                        timeout=300
                ) as response:
                    data = await response.json()
            chart = data['chart']['result'][0]
            return await Quotes.objects.acreate(
                stock=self,
                ohlcv=pd.DataFrame(
                    # TODO: consider timezone
                    index=pd.to_datetime(
                        arg=chart['timestamp'],
                        unit='s'
                    ),
                    data=chart['indicators']['quote'][0]
                ),
                timeframe=timeframe
            )
        except Exception as exc:
            print(
                response, exc,
                f'Parsing error for {self.symbol} on {timeframe} timeframe',
                sep='\n\n'
            )
            return None

    @property
    def quotes(
            self: Self
    ) -> models.QuerySet:
        return Quotes.objects.filter(
            stock=self
        )

    class Meta:
        get_latest_by = '-symbol'
        ordering = (
            'type',
            'symbol',
            'name'
        )
