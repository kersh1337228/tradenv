from itertools import repeat
import multiprocessing
from typing import override
from rest_framework import status
from rest_framework.response import Response
import pandas as pd
from src.async_api.views import AsyncAPIView
from .strategies import strategies_data, Environment
from .utils import (
    task,
    test
)
from ..logs.models import Log
from ..portfolios.models import Portfolio


class StrategyAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        return Response(
            data=strategies_data,
            status=status.HTTP_200_OK
        )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        strategies = request.data.pop('strategies')
        size = len(strategies)

        portfolio = await Portfolio.objects.aget(
            id=request.data.pop('portfolio')
        )

        range_start = request.data.pop('range_start')
        range_end = request.data.pop('range_end')
        timeframe = request.data.pop('timeframe')
        commission = request.data.pop('commission')
        mode = request.data.pop('mode')

        if size > 1:
            with multiprocessing.Pool(min(
                size,
                multiprocessing.cpu_count()
            )) as pool:
                logs = pool.starmap(
                    task,
                    zip(
                        strategies,
                        repeat(portfolio, size),
                        repeat(range_start, size),
                        repeat(range_end, size),
                        repeat(timeframe, size),
                        repeat(commission, size),
                        repeat(mode, size)
                    )
                )
        else:
            name, params = strategies[0]
            logs = (await test(
                name=name,
                params=params,
                env=Environment(
                    portfolio=portfolio,
                    range_start=range_start,
                    range_end=range_end,
                    timeframe=timeframe,
                    commission=commission,
                    mode=mode
                )
            ),)

        log = await Log.objects.acreate(
            strategies=strategies,
            portfolio=await portfolio.create_snapshot(),
            range_start=range_start,
            range_end=range_end,
            timeframe=timeframe,
            commission=commission,
            mode=mode,
            logs=pd.concat(
                objs=logs,
                axis=0,
                keys=map(
                    lambda pair: f'{pair[0]} ({'; '.join(
                        map(
                            lambda param: f'{param[0]}: {param[1]}',
                            pair[1].items()
                        )
                    )})',
                    strategies
                )
            )
        )

        return Response(
            data=log.id,
            status=status.HTTP_201_CREATED
        )
