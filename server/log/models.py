import datetime
import pandas as pd
from django.db import models
from asgiref.sync import async_to_sync


# Custom field to store pandas DataFrames with MultiIndex
class MultiIndexDataFrameField(models.JSONField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def from_db_value(self, value: None | str, expression, connection):
        if not value:
            return pd.DataFrame()
        raws = super().from_db_value(value, expression, connection)
        return pd.concat(
            objs=map(pd.read_json, raws.values()),
            axis=0,
            keys=raws.keys()
        ).fillna(0.)

    def to_python(self, value: pd.DataFrame | None | str):
        if isinstance(value, pd.DataFrame):
            return value
        if not value:
            return pd.DataFrame()
        return pd.DataFrame(
            super().to_python(value)
        ).fillna(0.)

    def get_prep_value(self, value: pd.DataFrame):
        return super().get_prep_value(value)


class Log(models.Model):  # Analytical log storing full strategy application result
    range_start = models.DateTimeField()
    range_end = models.DateTimeField()
    strategies = models.JSONField()  # Strategies and parameters used
    portfolio = models.ForeignKey(
        'portfolio.Portfolio',
        on_delete=models.CASCADE
    )
    logs = MultiIndexDataFrameField(  # Analysis result
        blank=False,
        null=False
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        db_index=True,
    )

    @async_to_sync
    async def get_price_deltas(self) -> dict:
        return {
            'balance': [
                {
                    'strategy': strategy,
                    'percent': round(
                        (self.logs.loc[strategy].iloc[-1]['value'] /
                        self.logs.loc[strategy].iloc[0]['value'] - 1) * 100, 2
                    ),
                    'currency': round(
                        self.logs.loc[strategy].iloc[-1]['value'] -
                        self.logs.loc[strategy].iloc[0]['value'], 2
                    )
                }
                for strategy in self.logs.index.levels[0]
            ],
            'stocks': await self.portfolio.stocks_price_deltas(
                self.range_start, self.range_end
            )
        }

    def get_logs(self) -> dict:
        def transform(df: pd.DataFrame):  # Logs proper formatting
            df = df.xs(df.name).rename_axis('date') # Separating MultiIndex levels
            df.index = df.index.strftime('%Y-%m-%d')  # Changing TimeStamp to str
            return df.reset_index().to_dict('records')  # Serializing
        logs = self.logs.groupby(level=0).apply(
            transform
        ).to_frame().reset_index()
        logs.columns = ('strategy', 'data')
        return logs.to_dict('records')

    @async_to_sync
    async def get_stocks_quotes(self):
        return await self.portfolio.get_all_quotes(
            self.range_start, self.range_end, 'dict'
        )

    def save(  # Custom save method to create slug using name
            self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ):
            if not self.slug:
                self.slug = f'''log_{datetime.datetime.now().strftime(
                    "%Y_%m_%d_%H_%M_%S"
                )}'''
            super().save(
                force_insert=False,
                force_update=False,
                using=None,
                update_fields=None
            )
