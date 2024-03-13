import numpy as np
import pandas as pd
from typing import Literal
import sys


def sma(
        quotes: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close']
) -> pd.DataFrame:
    prices = quotes[price].to_numpy()
    return pd.DataFrame(
        data={
            'sma': np.hstack((
                np.full(period_length, None),
                np.vectorize(
                    lambda i: prices[i - period_length:i].mean()
                )(np.arange(period_length, prices.size))
            ))
        },
        index=quotes.index
    )


def ema(
        quotes: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close']
) -> pd.DataFrame:
    prices = quotes[price].to_numpy()
    q = (period_length - 1) / (period_length + 1)
    return pd.DataFrame(
        data={
            'ema': np.hstack((
                np.full(period_length, None),
                np.vectorize(
                    lambda i: np.average(
                        prices[i - period_length:i],
                        weights=q ** (i - np.arange(i - period_length, i)) / (1 - q)
                    )
                )(np.arange(period_length, prices.size))
            ))
        },
        index=quotes.index
    )


def vwma(
    quotes: pd.DataFrame,
    period_length: int,
    price: Literal['open', 'high', 'low', 'close'],
) -> pd.DataFrame:
    return wma(
        quotes, period_length,
        price, quotes['volume']
    ).rename(columns={'wma': 'vwma'})


def wma(
    quotes: pd.DataFrame,
    period_length: int,
    price: Literal['open', 'high', 'low', 'close'],
    weights: np.ndarray
) -> pd.DataFrame:
    prices = quotes[price].to_numpy()
    return pd.DataFrame(
        data={
            'wma': np.hstack((
                np.full(period_length, None),
                np.vectorize(
                    lambda i: np.average(
                        prices[i - period_length:i],
                        weights=weights[i - period_length:i]
                    )
                )(np.arange(period_length, prices.size))
            ))
        },
        index=quotes.index
    )


def macd(
    quotes: pd.DataFrame,
    fast_period: int,
    slow_period: int,
    smoothing_period: int,
    price: Literal['open', 'high', 'low', 'close'],
    macd_ma_type: Literal['sma', 'ema'],
    signal_ma_type: Literal['sma', 'ema']
) -> pd.DataFrame:
    result = quotes.assign(
        macd=lambda data: (
            getattr(
                sys.modules[__name__], macd_ma_type
            )(data, fast_period, price) -
            getattr(
                sys.modules[__name__], macd_ma_type
            )(data, slow_period, price)
        )
    )
    result = result.assign(
        signal=lambda data: getattr(
            sys.modules[__name__], signal_ma_type
        )(data, smoothing_period, 'macd')
    )
    result = result.assign(
        hist=lambda data: data['macd'] - data['signal']
    )
    return result[['macd', 'signal', 'hist']].replace([np.nan], [None])


choices = [  # Front-end indicators representations
    {
        'verbose_name': 'Simple Moving average',
        'alias': 'sma',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        },
        'separate': False,
        'plots': {
            'sma': 'line'
        }
    },
    {
        'verbose_name': 'Exponential Moving Average',
        'alias': 'ema',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        },
        'separate': False,
        'plots': {
            'ema': 'line'
        }
    },
    {
        'verbose_name': 'Volume Weighted Moving Average',
        'alias': 'vwma',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        },
        'separate': False,
        'plots': {
            'vwma': 'line'
        }
    },
    {
        'verbose_name': 'Moving Averages Convergence Divergence',
        'alias': 'macd',
        'args': {
            'fast_period': 'int',
            'slow_period': 'int',
            'smoothing_period': 'int',
            'price': ('open', 'high', 'low', 'close'),
            'macd_ma_type': ('sma', 'ema'),
            'signal_ma_type': ('sma', 'ema'),
        },
        'separate': True,
        'plots': {
            'macd': 'line',
            'signal': 'line',
            'hist': 'hist'
        }
    },
]
