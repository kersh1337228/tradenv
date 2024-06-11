import pandas as pd
from src.apps.logs import models
from src.apps.portfolios.serializers import PortfolioSerializer
from src.apps.stocks.models import timeframe_format
from src.async_api.serializers import (
    AsyncModelSerializer,
    AsyncSerializerMethodField
)


class LogPartialSerializer(AsyncModelSerializer):
    class Meta:
        model = models.Log
        exclude = (
            'strategies',
            'portfolio',
            'logs'
        )


class LogSerializer(AsyncModelSerializer):
    portfolio = PortfolioSerializer(read_only=True)
    results = AsyncSerializerMethodField(read_only=True)
    logs = AsyncSerializerMethodField(read_only=True)
    quotes = AsyncSerializerMethodField(read_only=True)

    @staticmethod
    async def get_results(
            log: models.Log
    ) -> dict:

        def format(
                log: pd.DataFrame
        ) -> dict:
            first, last = log['value'].iloc[[0, -1]]
            return {
                'abs': round(last - first, 2),
                'rel': round((last / first - 1) * 100, 2)
            }

        return {
            'strategies': {
                strategy: format(log.logs.loc[strategy])
                for strategy in log.logs.index.levels[0]
            },
            'stocks': await log.portfolio.deltas(
                timeframe=log.timeframe,
                range_start=log.range_start,
                range_end=log.range_end,
                price='close'
            )
        }

    @staticmethod
    async def get_logs(
            log: models.Log
    ) -> dict:

        def format(
                log: pd.DataFrame
        ) -> list[dict]:
            return log.set_index(
                log.index.strftime(
                    timeframe_format[log.timeframe]
                )
            ).reset_index(
                names='timestamp'
            ).to_dict(
                orient='records'
            )

        return {
            strategy: format(log.logs.loc[strategy])
            for strategy in log.logs.index.levels[0]
        }

    @staticmethod
    async def get_quotes(
            log: models.Log
    ) -> dict:
        return await log.portfolio.to_dict(
            timeframe=log.timeframe,
            range_start=log.range_start,
            range_end=log.range_end
        )

    class Meta:
        model = models.Log
        fields = '__all__'
