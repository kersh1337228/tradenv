import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'src.settings'
import django
django.setup()


import asyncio
import pandas as pd
from src.apps.portfolios.models import Portfolio
from src.apps.stocks.models import (
    DateTime,
    TimeFrame
)
from . import strategies
from src.apps.strategies.strategies import Environment, Strategy


async def test(
        name: str,
        params: dict[str, int | float | bool | str | list],
        env: Environment
) -> pd.DataFrame:
    strategy: Strategy = getattr(
        strategies,
        name
    )

    async with env:
        strategy(env, **params)

    return env.logs


def task(
        strategy: tuple[str, dict[str, int | float | bool | str | list]],
        portfolio: Portfolio,
        range_start: DateTime,
        range_end: DateTime,
        timeframe: TimeFrame,
        commission: float,
        mode: int
) -> pd.DataFrame:
    return asyncio.run(test(
        name=strategy[0],
        params=strategy[1],
        env=Environment(
            portfolio=portfolio,
            range_start=range_start,
            range_end=range_end,
            timeframe=timeframe,
            commission=commission,
            mode=mode
        )
    ))
