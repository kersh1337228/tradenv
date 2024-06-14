import datetime
import inspect
import pkgutil
import sys
from importlib import import_module
from typing import (
    Self,
    Callable,
    override
)
from abc import (
    ABC,
    abstractmethod
)
import pandas as pd
from src.apps.portfolios.models import Portfolio
from src.apps.stocks.models import (
    DateTime,
    TimeFrame,
    timeframe_delta
)
from src.utils.functions import signature


class Environment:
    def __init__(
            self: Self,
            portfolio: Portfolio,
            range_start: DateTime,
            range_end: DateTime,
            timeframe: TimeFrame,
            commission: float = 0.0,
            mode: int = 0
    ):
        self.portfolio = portfolio
        self.timeframe = timeframe
        self.range_start = range_start
        self.range_end = range_end
        self.commission = commission
        self.mode = mode if timeframe_delta[timeframe] >= datetime.timedelta(days=1) else 0

    def buy(
            self: Self,
            symbol: str,
            amount: int | None = None
    ) -> bool:
        currency = self.currencies[symbol]
        balance = self.balance.loc[self.timestamp, currency]
        price = self.quotes.loc[(symbol, self.timestamp), 'close']
        stocks = self.stocks.iloc[self.index]

        max_amount = balance // (price * (1 + self.commission))
        if amount is None:
            amount = max_amount
        amount = amount if amount < max_amount else max_amount

        if self.portfolio.long_limit is not None:
            longs = stocks[stocks > 0].sum()
            if longs + 1 > self.portfolio.long_limit:
                return False

        if amount > 0:
            self.queue.append({
                'symbol': symbol,
                'payload': amount,
                'delay': self.mode
            })
            self.balance.loc[self.timestamp, currency] \
                -= amount * price * (1 + self.commission)

            return True

        return False

    def sell(
            self: Self,
            symbol: str,
            amount: int | None = None
    ) -> bool:
        price = self.quotes.loc[(symbol, self.timestamp), 'close']
        stocks = self.stocks.iloc[self.index]

        max_amount = stocks[symbol]
        if amount is None:
            amount = max_amount
        amount = amount if amount < max_amount else max_amount

        if self.portfolio.short_limit is not None:
            shorts = stocks[stocks < 0].sum()
            if shorts + 1 > self.portfolio.short_limit:
                return False

        if amount > 0:
            self.queue.append({
                'symbol': symbol,
                'payload': -amount * price,
                'delay': self.mode
            })
            self.stocks.loc[self.timestamp, symbol] -= amount

            return True

        return False

    def finish(
            self: Self
    ) -> None:
        for i, order in enumerate(self.queue):
            if not order['delay']:
                if order['payload'] > 0:  # finish buy
                    self.stocks.loc[self.timestamp, order['symbol']] += order['payload']
                else:  # finish sell
                    currency = self.currencies[order['symbol']]
                    self.balance.loc[self.timestamp, currency] -= order['payload']
                del self.queue[i]
                continue
            order['delay'] -= 1

    def increment(
            self: Self
    ) -> None:
        self.index += 1
        self.timestamp = self.stocks.index[self.index]

        self.balance.iloc[self.index] = self.balance.iloc[self.index - 1]
        self.stocks.iloc[self.index] = self.stocks.iloc[self.index - 1]

    @property
    def symbols(
            self: Self
    ) -> pd.DatetimeIndex:
        return self.stocks.columns

    @property
    def range(
            self: Self
    ) -> pd.DatetimeIndex:
        return self.stocks.index

    def __iter__(
            self: Self
    ) -> 'Environment':
        self.index = 0
        self.timestamp = self.stocks.index[0]
        return self

    def __next__(
            self: Self
    ) -> tuple[pd.Timestamp, int]:
        self.finish()

        if self.index == self.stocks.index.size - self.mode - 1:
            for t in range(self.mode):
                self.finish()
                self.increment()

            raise StopIteration

        self.increment()

        return self.timestamp, self.index

    def __len__(
            self: Self
    ) -> int:
        return self.stocks.index.size

    async def __aenter__(
            self: Self
    ) -> 'Environment':
        self.quotes = await self.portfolio.to_dataframe(
            timeframe=self.timeframe,
            range_start=self.range_start,
            range_end=self.range_end
        )
        timestamps = self.quotes.index.levels[1]
        self.balance = pd.DataFrame(
            data={
                currency: balance
                async for currency, balance in self.portfolio.accounts.values_list(
                    'currency',
                    'balance'
                )
            },
            index=timestamps
        )
        self.stocks = pd.DataFrame(
            data=dict.fromkeys(self.quotes.index.levels[0], 0),
            index=timestamps
        )
        self.currencies = {
            symbol: currency
            async for symbol, currency in self.portfolio.stocks.values_list(
                'stock__symbol',
                'stock__currency'
            )
        }
        self.queue = []

        return self

    async def __aexit__(
            self: Self,
            exc_type,
            exc_val,
            exc_tb
    ):
        if exc_type is not None:  # finishing
            try:
                while True:
                    self.__next__()
            except StopIteration:
                pass
        converters = (await self.portfolio.converters(
            self.timeframe
        )).reindex(self.balance.index)
        currency = self.portfolio.currency
        value: pd.Series = 0

        for acc in self.balance.columns:
            converter = converters[f'{acc}/{currency}'] if acc != currency else 1
            value += self.balance[acc] * converter

        for symbol, curr in self.currencies.items():
            converter = converters[f'{curr}/{currency}'] if curr != currency else 1
            value += self.stocks[symbol] * self.quotes['close'].loc[symbol] * converter

        self.logs = pd.concat(
            objs=(
                self.balance,
                self.stocks,
                value.rename('value').to_frame()
            ),
            axis=1
        )
        return True


class Strategy(ABC):
    verbose_name: str | None = None
    params: dict[str, str | tuple] = None

    @classmethod
    def as_instance(cls) -> 'Strategy':
        cls.params = cls.params or signature(cls.__call__)
        cls.verbose_name = cls.verbose_name or cls.__name__
        return cls()

    @abstractmethod
    def __call__(
            self: Self,
            env: Environment,
            *args,
            **kwargs
    ) -> None:
        pass


def strategy(
        verbose_name: str | None = None
) -> Callable:
    def decorator(
            function: Callable[[Environment, ...], None]
    ) -> Callable[[Environment, ...], None]:
        class WrappedStrategy(Strategy):
            __name__ = function.__name__
            params = signature(function)

            @override
            def __call__(
                    self,
                    env: Environment,
                    *args,
                    **kwargs
            ):
                return function(env, *args, **kwargs)

        WrappedStrategy.verbose_name = verbose_name or function.__name__
        return WrappedStrategy.as_instance()

    return decorator


strategies_list = []
strategies_data = {}
for pkg in pkgutil.iter_modules(__path__):
    module = import_module(f'.{pkg.name}', __name__)

    function_strategies = inspect.getmembers(
        module, lambda member: isinstance(member, Strategy)
    )
    for name_, value_ in function_strategies:
        strategies_list.append(name_)
        strategies_data[name_] = {
            'verbose_name': value_.verbose_name,
            'params': value_.params
        }
        setattr(sys.modules[__name__], name_, value_)

    class_strategies = inspect.getmembers(
        module, lambda member: inspect.isclass(member)
        and issubclass(member, Strategy)
        and member != Strategy
    )
    for name_, value_ in class_strategies:
        strategies_list.append(name_)
        instance = value_.as_instance()
        strategies_data[name_] = {
            'verbose_name': instance.verbose_name,
            'params': instance.params
        }
        setattr(sys.modules[__name__], name_, instance)


__all__ = (
    'Environment',
    'Strategy',
    'strategy',
    'strategies_data',
    *strategies_list
)
