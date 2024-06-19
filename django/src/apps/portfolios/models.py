import datetime
import itertools
from typing import (
    Self, 
    Literal,
    override
)
from django.core.validators import (
    MinValueValidator,
    RegexValidator
)
from django.db import models
import pandas as pd
from src.apps.logs.models import Log
from src.apps.stocks.models import (
    Stock,
    Quotes,
    TimeFrame,
    DateTime,
    timeframe_format,
    timeframe_delta
)
from src.utils.functions import index_intersection


class Portfolio(models.Model):
    id = models.SlugField(
        max_length=275,
        primary_key=True
    )
    name = models.CharField(
        max_length=255,
        validators=(
            RegexValidator(
                regex=r'^\w+$',
                message=r'Portfolio name must satisfy: "^\w+$"',
                code='invalid_name'
            ),
        )
    )
    currency = models.CharField(
        max_length=3,
        default='USD'
    )
    is_snapshot = models.BooleanField(
        default=False
    )

    long_limit = models.PositiveSmallIntegerField(  # Max simultaneous longs
        validators=(
            MinValueValidator(1),
        ),
        default=None,
        null=True,
        blank=True
    )
    short_limit = models.PositiveSmallIntegerField(  # Max simultaneous shorts
        validators=(
            MinValueValidator(1),
        ),
        default=None,
        null=True,
        blank=True
    )

    create_time = models.DateTimeField(
        auto_now_add=True
    )
    update_time = models.DateTimeField(
        auto_now=True,
    )

    @property
    def stocks(
            self: Self
    ) -> models.QuerySet:
        return StockInstance.objects.filter(
            portfolio=self
        )

    @property
    def accounts(
            self: Self
    ) -> models.QuerySet:
        return Account.objects.filter(
            portfolio=self
        )

    @property
    def logs(
            self: Self
    ) -> models.QuerySet:
        return Log.objects.filter(
            portfolio__name=self.name
        )

    @property
    def snapshots(
            self: Self
    ) -> models.QuerySet:
        return Portfolio.objects.filter(
            name=self.name,
            is_snapshot=True
        )

    async def converters(
            self: Self,
            timeframe: TimeFrame,
            range_start: DateTime = None,
            range_end: DateTime = None
    ) -> pd.DataFrame:
        accounts_currency = [
            currency async for currency in self.accounts.values_list(
                'currency',
                flat=True
            )
        ]

        forex_names = tuple(
            map(
                lambda pair: f'{pair[0]}/{pair[1]}',
                filter(
                    lambda pair: pair[0] != pair[1],
                    itertools.product(
                        accounts_currency,
                        (self.currency,)
                    )
                )
            )
        )

        delta = timeframe_delta[timeframe]
        rng = pd.date_range(
            start=range_start,
            end=range_end,
            freq=delta
        ).floor(delta).unique()

        def fill(ohlcv: pd.DataFrame) -> pd.DataFrame:
            ohlcv.index = ohlcv.index.floor(delta).unique()
            return ohlcv.reindex(rng).ffill().bfill()

        items = [
            (name, fill(ohlcv))
            async for name, ohlcv in Quotes.objects.filter(
                stock__name__in=forex_names,
                timeframe=timeframe
            ).values_list(
                'stock__name',
                'ohlcv'
            )
        ]

        return pd.concat(
            objs=map(
                lambda pair: pair[1]['close']
                .rename(pair[0]),
                items
            ),
            axis=1
        )

    @property
    async def stock_converters(
            self: Self
    ) -> models.QuerySet:
        accounts_currency = [
            currency async for currency in self.accounts
            .values_list('currency', flat=True)
        ]
        stocks_currency = [
            currency async for currency in self.stocks
            .order_by()
            .values_list('stock__currency', flat=True)
            .distinct()
        ]
        forex_names = tuple(
            map(
                lambda pair: f'{pair[0]}/{pair[1]}',
                filter(
                    lambda pair: pair[0] != pair[1],
                    itertools.product(
                        accounts_currency,
                        stocks_currency
                    )
                )
            )
        )
        return Stock.objects.filter(
            name__in=forex_names,
            type='forex'
        )

    def items(
            self: Self,
            timeframe: TimeFrame
    ) -> models.QuerySet:
        return Quotes.objects.filter(
            stock__in=self.stocks.values_list(
                'stock',
                flat=True
            ),
            timeframe=timeframe
        ).select_related(
            'stock'
        ).values_list(
            'stock__symbol',
            'ohlcv'
        )

    def quotes(
            self: Self,
            timeframe: TimeFrame
    ) -> models.QuerySet:
        return Quotes.objects.filter(
            stock__in=self.stocks.values_list(
                'stock',
                flat=True
            ),
            timeframe=timeframe
        ).values_list(
            'ohlcv',
            flat=True
        )

    async def borders(
            self: Self,
            timeframe: TimeFrame
    ) -> tuple[pd.Timestamp, pd.Timestamp]:
        lower = pd.Timestamp.min
        upper = pd.Timestamp.max

        async for instance in self.stocks.select_related('stock'):
            await instance.stock.parse_quotes(timeframe)

        quotes = self.quotes(timeframe)
        async for q in quotes:
            start, end = q.dropna().index[[0, -1]]
            lower = start if start > lower else lower
            upper = end if end < upper else upper

        return lower, upper

    async def max_range(
        self: Self,
        timeframe: TimeFrame
    ) -> pd.DatetimeIndex:
        return index_intersection([
            ohlcv async for ohlcv in self.quotes(timeframe)
        ])

    async def to_dataframe(
            self: Self,
            timeframe: TimeFrame,
            range_start: DateTime = None,
            range_end: DateTime = None
    ) -> pd.DataFrame:
        delta = timeframe_delta[timeframe]
        rng = pd.date_range(
            start=range_start,
            end=range_end,
            freq=delta
        ).floor(delta).unique()
        rng.freq = delta

        def fill(ohlcv: pd.DataFrame) -> pd.DataFrame:
            ohlcv.index = ohlcv.index.floor(delta).unique()
            return ohlcv.reindex(rng).ffill().bfill()

        symbols, quotes = zip(*[
            (symbol, fill(ohlcv))
            async for symbol, ohlcv in self.items(timeframe)
        ])

        return pd.concat(
            objs=quotes,
            axis=0,
            keys=symbols
        ).loc[pd.IndexSlice[:, range_start:range_end], :]

    async def to_dict(
            self: Self,
            timeframe: TimeFrame,
            range_start: DateTime = None,
            range_end: DateTime = None
    ) -> dict:
        items = self.items(timeframe)

        def serialize(
                ohlcv: pd.DataFrame
        ) -> list[dict]:
            return ohlcv.set_index(
                ohlcv.index.strftime(
                    timeframe_format[timeframe]
                )
            ).reset_index(
                names='timestamp'
            ).to_dict('records')

        return {
            symbol: serialize(ohlcv.loc[range_start:range_end])
            async for symbol, ohlcv in items
        }

    async def deltas(
            self: Self,
            timeframe: TimeFrame,
            range_start: DateTime = None,
            range_end: DateTime = None,
            price: Literal['open', 'high', 'low', 'close'] = 'close'
    ) -> dict:
        items = self.items(timeframe)

        def delta(ohlcv: pd.DataFrame):
            first, last = ohlcv.ffill().bfill().loc[
                slice(range_start, range_end), price
            ].iloc[[0, -1]]
            return {
                'rel': round((last / first - 1) * 100, 2) if first else None,
                'abs': round(last - first, 2)
            }

        return {
            symbol: delta(ohlcv)
            async for symbol, ohlcv in items
        }

    async def create_snapshot(
            self: Self
    ) -> 'Portfolio':
        snapshot = await self.__class__.objects.acreate(
            name=self.name,
            currency=self.currency,
            is_snapshot=True,
            long_limit=self.long_limit,
            short_limit=self.short_limit
        )

        async for account in self.accounts:
            account.pk = None
            account._state.adding = True
            account.portfolio = snapshot
            await account.asave()

        async for stock in self.stocks:
            stock.pk = None
            stock._state.adding = True
            stock.portfolio = snapshot
            await stock.asave()

        return snapshot

    @override
    def save(
            self: Self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ):
        if not self.pk:
            self.id = f'{self.name}-{
                datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
            }' if self.is_snapshot else self.name

        super().save(
            force_insert,
            force_update,
            using,
            update_fields
        )

    class Meta:
        get_latest_by = '-name'
        ordering = (
            'is_snapshot',
            'name'
        )
        constraints = (
            models.UniqueConstraint(
                name='unique_non_snapshot',
                fields=('name', 'is_snapshot'),
                condition=models.Q(is_snapshot=False)
            ),
        )


class StockInstance(models.Model):
    id = models.SlugField(
        max_length=296,
        primary_key=True
    )
    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE
    )
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE
    )
    amount = models.PositiveSmallIntegerField(
        validators=(
            MinValueValidator(1),
        ),
        default=1
    )
    priority = models.PositiveSmallIntegerField(
        validators=(
            MinValueValidator(1),
        )
    )

    @override
    def save(
            self: Self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ):
        if not self.pk:
            self.id = f'{self.stock_id}_in_{self.portfolio_id}'

        super().save(
            force_insert,
            force_update,
            using,
            update_fields
        )

    class Meta:
        get_latest_by = '-priority'
        ordering = (
            '-priority',
        )
        constraints = (
            models.UniqueConstraint(
                name='unique_stock_in_portfolio',
                fields=('stock', 'portfolio')
            ),
            models.UniqueConstraint(
                name='unique_priority_in_portfolio',
                fields=('portfolio', 'priority')
            )
        )


class Account(models.Model):
    id = models.SlugField(
        max_length=279,
        primary_key=True
    )
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE
    )
    currency = models.CharField(
        max_length=3,
        default='USD'
    )
    balance = models.FloatField(
        validators=(
            MinValueValidator(0.0),
        )
    )

    @override
    def save(
            self: Self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ):
        if not self.pk:
            self.id = f'{self.portfolio_id}_{self.currency}'

        super().save(
            force_insert,
            force_update,
            using,
            update_fields
        )

    class Meta:
        get_latest_by = '-currency'
        ordering = (
            'currency',
        )
        constraints = (
            models.UniqueConstraint(
                name='unique_currency_in_portfolio',
                fields=('portfolio', 'currency')
            ),
        )
