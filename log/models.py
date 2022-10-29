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
        df = pd.read_json(
            super().from_db_value(value, expression, connection)
        ).set_index('level_0', append=True).reorder_levels((1, 0))
        return df

    def to_python(self, value: pd.DataFrame | None | str):
        if isinstance(value, pd.DataFrame):
            return value
        if not value:
            return pd.DataFrame()
        return pd.DataFrame(super().to_python(value))

    def get_prep_value(self, value: pd.DataFrame):
        return super().get_prep_value(value.reset_index(level=0).to_json())


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
            'balance': {
                strategy: {
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
            },
            'stocks': await self.portfolio.stocks_price_deltas(
                self.range_start, self.range_end
            )
        }

    def get_logs(self) -> dict:
        def transform(df):  # Logs proper formatting
            df = df.xs(df.name) # Separating MultiIndex levels
            df.index = df.index.strftime('%Y-%m-%d')  # Changing TimeStamp to str
            return df.transpose().to_dict()  # Serializing
        return self.logs.groupby(  # Level-wise serialization
            level=0
        ).apply(transform).to_dict()

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
