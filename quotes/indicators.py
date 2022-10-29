import numpy as np
import pandas as pd


def sma(data: pd.DataFrame, price: str, n: int) -> np.ndarray:
    prices = data[price].to_numpy()
    return np.hstack((
        np.full(n, None),
        np.vectorize(
            lambda i: prices[i - n:i + 1].mean()
        )(np.arange(n, prices.size))
    ))


def ema(data: pd.DataFrame, price: str, n: int) -> np.ndarray:
    prices = data[price].to_numpy()
    q = (n - 1) / (n + 1)
    return np.hstack((
        np.full(n, None),
        np.vectorize(
            lambda i: np.average(
                prices[i - n:i + 1],
                weights=q ** (i - np.arange(i - n, i + 1)) / (1 - q)
            )
        )(np.arange(n, prices.size))
    ))


def wma(weights: np.ndarray) -> callable:
    def wrapped(data: pd.DataFrame, price: str, n: int) -> np.ndarray:
        prices = data[price].to_numpy()
        return np.hstack((
            np.full(n, None),
            np.vectorize(
                lambda i: np.average(
                    prices[i - n:i + 1],
                    weights=weights[i - n:i + 1]
                )
            )(np.arange(n, prices.size))
        ))
    return wrapped


choices = [  # Front-end indicators representations
    {
        'verbose_name': 'Simple Moving average',
        'displayed_name': 'sma 20 close',
        'alias': 'sma',
        'args': {
            'period_length': 20,
            'price': 'close'
        }
    },
    {
        'verbose_name': 'Exponential Moving Average',
        'displayed_name': 'ema 20 close',
        'alias': 'ema',
        'args': {
            'period_length': 20,
            'price': 'close'
        }
    },
    {
        'verbose_name': 'Volume Weighted Moving Average',
        'displayed_name': 'vwma 20 close',
        'alias': 'vwma',
        'args': {
            'period_length': 20,
            'price': 'close'
        }
    }
]
