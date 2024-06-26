import sys
from typing import Literal
import numpy as np
import pandas as pd
from . import indicator


@indicator(
    verbose_name='Simple Moving Average'
)
def sma(
        ohlcv: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close'] = 'close'
) -> pd.DataFrame:
    prices = ohlcv[price].to_numpy()
    return pd.DataFrame(
        data={
            'sma': np.hstack((
                np.full(period_length, np.nan),
                np.vectorize(
                    lambda i: prices[i - period_length:i].mean()
                )(np.arange(period_length, prices.size))
            ))
        },
        index=ohlcv.index
    )


@indicator(
    verbose_name='Exponential Moving Average'
)
def ema(
        ohlcv: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close'] = 'close'
) -> pd.DataFrame:
    prices = ohlcv[price].to_numpy()
    q = (period_length - 1) / (period_length + 1)
    return pd.DataFrame(
        data={
            'ema': np.hstack((
                np.full(period_length, np.nan),
                np.vectorize(
                    lambda i: np.average(
                        prices[i - period_length:i],
                        weights=q ** (i - np.arange(i - period_length, i)) / (1 - q)
                    )
                )(np.arange(period_length, prices.size))
            ))
        },
        index=ohlcv.index
    )


def wma(
        ohlcv: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close'],
        weights: np.ndarray
) -> pd.DataFrame:
    prices = ohlcv[price].to_numpy()
    return pd.DataFrame(
        data={
            'wma': np.hstack((
                np.full(period_length, np.nan),
                np.vectorize(
                    lambda i: np.average(
                        prices[i - period_length:i],
                        weights=weights[i - period_length:i]
                    )
                )(np.arange(period_length, prices.size))
            ))
        },
        index=ohlcv.index
    )


@indicator(
    verbose_name='Volume Weighted Moving Average'
)
def vwma(
        ohlcv: pd.DataFrame,
        period_length: int,
        price: Literal['open', 'high', 'low', 'close'] = 'close'
) -> pd.DataFrame:
    return wma(
        ohlcv, period_length,
        price, ohlcv['volume']
    ).rename(columns={'wma': 'vwma'})


@indicator(
    verbose_name='Moving Averages Convergence Divergence',
    plots={
        'hist': 'hist',
        'macd': 'line',
        'signal': 'line'
    },
    separate=True
)
def macd(
        ohlcv: pd.DataFrame,
        fast_period: int,
        slow_period: int,
        smoothing_period: int,
        price: Literal['open', 'high', 'low', 'close'] = 'close',
        macd_ma_type: Literal['sma', 'ema', 'vwma'] = 'sma',
        signal_ma_type: Literal['sma', 'ema', 'vwma'] = 'sma'
) -> pd.DataFrame:
    result = ohlcv.assign(
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
    return result[['hist', 'macd', 'signal']]
