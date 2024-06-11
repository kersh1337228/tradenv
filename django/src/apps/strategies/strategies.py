import datetime
import copy
import numpy as np
import pandas as pd
from itertools import combinations
from typing import Iterable, Literal
import src.apps.stocks.indicators as ind
from asgiref.sync import async_to_sync
# Multiprocessing required actions
import django
django.setup()


def simple_periodic(
        portfolio,
        range_start: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
        range_end: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
        period_length: int = 3,
) -> pd.DataFrame:
    portfolio_quotes = async_to_sync(portfolio.get_all_quotes)(_fill=True)
    symbols, date_range = (
        portfolio_quotes.index.levels[0],
        pd.date_range(range_start, range_end)
    )
    logs = pd.DataFrame(
        data={
            'balance': (portfolio.balance,) * period_length,
            'value': (portfolio.balance,) * period_length,
            'stocks': (pd.Series(index=symbols, data=0),) * period_length,
        },
        index=date_range[:period_length]
    )
    for date in date_range[:-period_length]:
        log = copy.deepcopy(logs.iloc[-1])
        log['stocks'] = log['stocks'].copy()
        current_date = date + period_length * date_range.freq
        for symbol in symbols:
            period_quotes = portfolio_quotes.loc[symbol, 'close']
            current = period_quotes.loc[current_date]
            for delta in range(period_length):
                prev = period_quotes.loc[date + delta * date_range.freq]
                long_amount, short_amount = (
                    log['stocks'][log['stocks'] > 0].sum(),
                    log['stocks'][log['stocks'] < 0].sum()
                )
                if all((
                    current > prev,
                    long_amount + 1 <= portfolio.long_limit or
                    log['stocks'][symbol] + 1 <= 0,
                    log['balance'] >= current
                )):
                    log['stocks'][symbol] += 1
                    log['balance'] -= current
                elif all((
                    current < prev,
                    short_amount - 1 >= -portfolio.short_limit or
                    log['stocks'][symbol] - 1 >= 0
                )):
                    log['stocks'][symbol] -= 1
                    log['balance'] += current
        log['value'] = log['balance'] + (
            log['stocks'].values * portfolio_quotes.loc[
                (slice(None), current_date), 'close'
            ].values
        ).sum()
        logs.loc[current_date] = log
    return logs.asfreq(date_range.freq)


def ma_levels(
        portfolio,
        periods: Iterable[int],
        indicator: Literal['sma', 'ema', 'vwma'],
        range_start: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
        range_end: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
) -> pd.DataFrame:
    indicator = getattr(ind, indicator)
    def indicator_wrapper(price, period):
        def wrapped(data):
            return indicator(data, price, period)
        return wrapped
    assigns = {
        f'{indicator.__name__}{period}':
            indicator_wrapper('close', period)
        for period in periods
    }
    portfolio_quotes = async_to_sync(
        portfolio.get_all_quotes
    )(_fill=True).groupby(
        level=0, group_keys=False
    ).apply(
        lambda symbol: symbol.assign(**assigns)
    )
    symbols, date_range = (
        portfolio_quotes.index.levels[0],
        pd.date_range(range_start, range_end)
    )
    skip = max((
        1,
        min(periods) - (  # Days amount with no moving averages
            pd.Timestamp(range_start) - portfolio_quotes.index[0][1]
        ).days - 1
    ))
    logs = pd.DataFrame(
        data={
            'balance': (portfolio.balance,) * skip,
            'value': (portfolio.balance,) * skip,
            'stocks': (pd.Series(index=symbols, data=0),) * skip,
        },
        index=(date_range[:skip])
    )
    for date in date_range[skip:]:
        log = copy.deepcopy(logs.iloc[-1])
        log['stocks'] = log['stocks'].copy()
        for symbol in symbols:
            period_quotes = portfolio_quotes.loc[(symbol, date)]
            for level in assigns.keys():
                close_price, level_price = period_quotes[['close', level]]
                if level_price:
                    long_amount, short_amount = (
                        log['stocks'][log['stocks'] > 0].sum(),
                        log['stocks'][log['stocks'] < 0].sum()
                    )
                    if all((
                        close_price > level_price,
                        long_amount + 1 <= portfolio.long_limit or
                        log['stocks'][symbol] + 1 <= 0,
                        log['balance'] >= close_price
                    )):
                        log['stocks'][symbol] += 1
                        log['balance'] -= close_price
                    elif all((
                        close_price < level_price,
                        short_amount - 1 >= -portfolio.short_limit or
                        log['stocks'][symbol] - 1 >= 0
                    )):
                        log['stocks'][symbol] -= 1
                        log['balance'] += close_price
        log['value'] = log['balance'] + (
            log['stocks'].values * portfolio_quotes.loc[
                (slice(None), date), 'close'
            ].values
        ).sum()
        logs.loc[date] = log
    return logs.asfreq(date_range.freq)


def mutual_ma_positions(
        portfolio,
        periods: Iterable[int],
        indicator: Literal['sma', 'ema', 'vwma'],
        range_start: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
        range_end: str | datetime.datetime | pd.Timestamp | np.datetime64 = None,
) -> pd.DataFrame:
    indicator = getattr(ind, indicator)
    def indicator_wrapper(price, period):
        def wrapped(data):
            return indicator(data, price, period)
        return wrapped

    periods = tuple(sorted(periods))
    assigns = {
        f'{indicator.__name__}{period}':
            indicator_wrapper('close', period)
        for period in periods
    }
    portfolio_quotes = async_to_sync(
        portfolio.get_all_quotes
    )(_fill=True).groupby(
        level=0, group_keys=False
    ).apply(
        lambda symbol: symbol.assign(**assigns)
    )
    symbols, date_range = (
        portfolio_quotes.index.levels[0],
        pd.date_range(range_start, range_end)
    )
    skip = max((
        1,
        min(periods) - (  # Days amount with no moving averages
                pd.Timestamp(range_start) - portfolio_quotes.index[0][1]
        ).days - 1
    ))
    logs = pd.DataFrame(
        data={
            'balance': (portfolio.balance,) * skip,
            'value': (portfolio.balance,) * skip,
            'stocks': (pd.Series(index=symbols, data=0),) * skip,
        },
        index=(date_range[:skip])
    )
    levels_pairs = list(combinations(assigns, 2))
    for date in date_range[skip:]:
        log = copy.deepcopy(logs.iloc[-1])
        log['stocks'] = log['stocks'].copy()
        for symbol in symbols:
            period_quotes = portfolio_quotes.loc[(symbol, date)]
            for l1, l2 in levels_pairs:
                close_price, l1_price, l2_price = period_quotes[['close', l1, l2]]
                if l1_price and l2_price:
                    long_amount, short_amount = (
                        log['stocks'][log['stocks'] > 0].sum(),
                        log['stocks'][log['stocks'] < 0].sum()
                    )
                    if all((
                        l1_price > l2_price,
                        long_amount + 1 <= portfolio.long_limit or
                        log['stocks'][symbol] + 1 <= 0,
                        log['balance'] >= close_price
                    )):
                        log['stocks'][symbol] += 1
                        log['balance'] -= close_price
                    elif all((
                        l1_price < l2_price,
                        short_amount - 1 >= -portfolio.short_limit or
                        log['stocks'][symbol] - 1 >= 0
                    )):
                        log['stocks'][symbol] -= 1
                        log['balance'] += close_price
        log['value'] = log['balance'] + (
            log['stocks'].values * portfolio_quotes.loc[
                (slice(None), date), 'close'
            ].values
        ).sum()
        logs.loc[date] = log
    return logs.asfreq(date_range.freq)


choices = [  # Frond-end strategies representations
    {
        'verbose_name': 'Simple periodic',
        'alias': 'simple_periodic',
        'args': {
            'period_length': 'int'
        }
    }, {
        'verbose_name': 'Moving Averages levels',
        'alias': 'ma_levels',
        'args': {
            'periods': 'list[int]',
            'indicator': ('sma', 'ema', 'vwma')
        }
    }, {
        'verbose_name': 'Mutual Moving Averages positions',
        'alias': 'mutual_ma_positions',
        'args': {
            'periods': 'list[int]',
            'indicator': ('sma', 'ema', 'vwma')
        }
    }
]
