from itertools import combinations
from typing import (
    Literal,
    Callable
)
import numpy as np
import pandas as pd
from src.apps.stocks import indicators
from src.apps.strategies.strategies import (
    strategy,
    Environment
)


@strategy(
    verbose_name='Conservative'
)
def conservative(
        env: Environment
) -> None:
    for timestamp, _ in env:
        for symbol in env.symbols:
            env.buy(symbol)


@strategy(
    verbose_name='Simple Periodic'
)
def simple_periodic(
        env: Environment,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close']
) -> None:
    for timestamp, _ in env:
        current_timestamp = timestamp + period_length * env.freq
        for symbol in env.symbols:
            period_quotes = env.quotes.loc[symbol, price]
            current = period_quotes.loc[current_timestamp]
            for delta in range(period_length):
                prev = period_quotes.loc[timestamp + delta * env.freq]
                if current > prev:
                    env.buy(symbol, 1)
                elif current < prev:
                    env.sell(symbol, 1)


@strategy(
    verbose_name='Moving Averages Levels'
)
def ma_levels(
        env: Environment,
        periods: list[int],
        price: Literal['open', 'high', 'low', 'close'],
        ma_type: Literal['sma', 'ema', 'vwma']
) -> None:
    ma = getattr(indicators, ma_type)

    def curry(
            period_length: int
    ) -> Callable[[pd.DataFrame], pd.DataFrame]:
        def curried(
                ohlcv: pd.DataFrame
        ) -> pd.DataFrame:
            return ma(
                ohlcv=ohlcv,
                period_length=period_length,
                price=price
            )
        return curried

    assigns = {
        f'{ma.__name__}{period}': curry(period)
        for period in periods
    }
    env.quotes = env.quotes.groupby(
        level=0,
        group_keys=False
    ).apply(
        lambda symbol_: symbol_.assign(**assigns)
    )

    for timestamp, _ in env:
        for symbol in env.symbols:
            period_quotes = env.quotes.loc[(symbol, timestamp)]
            current_price = period_quotes[price]
            for level in assigns.keys():
                level_price = period_quotes[level]
                if not np.isnan(level_price):
                    if current_price > level_price:
                        env.buy(symbol, 1)
                    elif current_price < level_price:
                        env.sell(symbol, 1)


@strategy(
    verbose_name='Mutual Moving Averages Positions'
)
def mutual_ma_positions(
        env: Environment,
        periods: list[int],
        price: Literal['open', 'high', 'low', 'close'],
        ma_type: Literal['sma', 'ema', 'vwma']
) -> None:
    ma = getattr(indicators, ma_type)

    def curry(
            period_length: int
    ) -> Callable[[pd.DataFrame], pd.DataFrame]:
        def curried(
                ohlcv: pd.DataFrame
        ) -> pd.DataFrame:
            return ma(
                ohlcv=ohlcv,
                period_length=period_length,
                price=price
            )
        return curried

    assigns = {
        f'{ma.__name__}{period}': curry(period)
        for period in sorted(periods)
    }
    env.quotes = env.quotes.groupby(
        level=0,
        group_keys=False
    ).apply(
        lambda symbol_: symbol_.assign(**assigns)
    )

    level_pairs = tuple(combinations(assigns, 2))
    for timestamp, _ in env:
        for symbol in env.symbols:
            period_quotes = env.quotes.loc[(symbol, timestamp)]
            for l1, l2 in level_pairs:
                l1_price, l2_price = period_quotes[[l1, l2]]
                if not np.isnan(l1_price) and not np.isnan(l2_price):
                    if l1_price > l2_price:
                        env.buy(symbol, 1)
                    elif l1_price < l2_price:
                        env.sell(symbol, 1)
