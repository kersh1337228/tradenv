import pandas as pd
from rest_framework import serializers
from src.apps.logs import models
from src.apps.portfolios.serializers import PortfolioSerializer
from src.apps.stocks.models import timeframe_format
from src.async_api.serializers import AsyncModelSerializer
from src.async_api.fields import AsyncSerializerMethodField


class LogPartialSerializer(AsyncModelSerializer):
    strategies = serializers.SerializerMethodField(read_only=True)
    portfolio = serializers.PrimaryKeyRelatedField(
        source='portfolio.name',
        read_only=True
    )

    @staticmethod
    def get_strategies(
            log: models.Log
    ) -> list[str]:
        return list(
            map(
                lambda pair: f'{pair[0]} ({'; '.join(
                    map(
                        lambda param: f'{param[0]}: {param[1]}',
                        pair[1].items()
                    )
                )})',
                log.strategies
            )
        )

    class Meta:
        model = models.Log
        fields = (
            'id',
            'strategies',
            'portfolio',
            'create_time'
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

        def fmt(
                logs: pd.DataFrame
        ) -> dict:
            value = logs['value']
            first = value.iloc[0]

            abs = value - first
            rel = abs / first * 100

            ret = {
                'abs': round(abs.iloc[-1], 2),
                'rel': round(rel.iloc[-1], 2)
            }

            neg = rel[rel < 0]
            if neg.size:
                ret['avg_loss'] = round(neg.mean(), 2)
                ret['max_loss'] = round(neg.min(), 2)
            else:
                ret['avg_loss'] = 0
                ret['max_loss'] = 0

            pos = rel[rel > 0]
            if pos.size:
                ret['avg_profit'] = round(pos.mean(), 2)
                ret['max_profit'] = round(pos.max(), 2)
            else:
                ret['avg_profit'] = 0
                ret['max_profit'] = 0

            neg_sum = neg.sum()
            pos_sum = pos.sum()
            ret['pli'] = round((pos_sum + neg_sum) / (pos_sum - neg_sum), 2)

            return ret

        return {
            'strategies': {
                strategy: fmt(log.logs.loc[strategy])
                for strategy in log.logs.index
                .get_level_values(0)
                .unique()
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

        def fmt(
                logs: pd.DataFrame
        ) -> list[dict]:
            return logs.assign(
                rel=lambda df: (df['value'] / df['value'].iloc[0] - 1) * 100
            ).set_index(
                logs.index.strftime(
                    timeframe_format[log.timeframe]
                )
            ).reset_index(
                names='timestamp'
            ).to_dict(
                orient='records'
            )

        return {
            strategy: fmt(log.logs.loc[strategy])
            for strategy in log.logs.index
            .get_level_values(0)
            .unique()
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
        exclude = (
            '_order',
        )
