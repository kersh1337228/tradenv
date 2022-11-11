import numpy as np
import pandas as pd
from typing import Literal
import datetime
import sys


def indicator_wrapper(
    name: str,
    quotes: pd.DataFrame,
    range_start: str | datetime.datetime | pd.Timestamp | np.datetime64,
    range_end: str | datetime.datetime | pd.Timestamp | np.datetime64,
    args: dict
) -> dict:
    indicator = next(filter(lambda i: i['name'] == name, choices))
    for arg, dtype in indicator['args'].items():
        match dtype:
            case 'int':
                args[arg] = int(args[arg])
            case 'float':
                args[arg] = float(args[arg])
            case 'str':
                args[arg] = str(args[arg])
            case 'list[int]':
                args[arg] = [int(args.pop(key)) for key in tuple(args.keys()) if arg in key]
            case 'list[float]':
                args[arg] = [float(args.pop(key)) for key in tuple(args.keys()) if arg in key]
    return {
        'name': name,
        'verbose_name': ' '.join((name,) + tuple(map(str, args.values()))),
        'args': args,
        'data': pd.Series(
            data=getattr(sys.modules[__name__], name)(quotes, **args),
            index=quotes.index
        )[slice(range_start, range_end)].tolist()
    }


def sma(
        quotes: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close']
) -> np.ndarray:
    prices = quotes[price].to_numpy()
    return np.hstack((
        np.full(period_length, None),
        np.vectorize(
            lambda i: prices[i - period_length:i].mean()
        )(np.arange(period_length, prices.size))
    ))


def ema(
        quotes: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close']
) -> np.ndarray:
    prices = quotes[price].to_numpy()
    q = (period_length - 1) / (period_length + 1)
    return np.hstack((
        np.full(period_length, None),
        np.vectorize(
            lambda i: np.average(
                prices[i - period_length:i],
                weights=q ** (i - np.arange(i - period_length, i)) / (1 - q)
            )
        )(np.arange(period_length, prices.size))
    ))


def vwma(
    quotes: pd.DataFrame,
    period_length: int,
    price: Literal['open', 'high', 'low', 'close'],
) -> np.ndarray:
    return wma(
        quotes, period_length,
        price, quotes['volume']
    )


def wma(
    quotes: pd.DataFrame,
    period_length: int,
    price: Literal['open', 'high', 'low', 'close'],
    weights: np.ndarray
) -> np.ndarray:
    prices = quotes[price].to_numpy()
    return np.hstack((
        np.full(period_length, None),
        np.vectorize(
            lambda i: np.average(
                prices[i - period_length:i],
                weights=weights[i - period_length:i]
            )
        )(np.arange(period_length, prices.size))
    ))


choices = [  # Front-end indicators representations
    {
        'verbose_name': 'Simple Moving average',
        'name': 'sma',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        },
    },
    {
        'verbose_name': 'Exponential Moving Average',
        'name': 'ema',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        }
    },
    {
        'verbose_name': 'Volume Weighted Moving Average',
        'name': 'vwma',
        'args': {
            'period_length': 'int',
            'price': ('open', 'high', 'low', 'close')
        }
    },
]
