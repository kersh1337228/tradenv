import pickle
from typing import (
    Self,
    override
)
from django.db import models
from django.db.models.expressions import Col
from django.db.backends.base.base import BaseDatabaseWrapper
import pandas as pd


__all__ = (
    'DataFrameField',
)


class DataFrameField(models.BinaryField):
    def __init__(
            self: Self,
            *args,
            **kwargs
    ):
        super().__init__(
            *args,
            **kwargs
        )

    @staticmethod
    def from_db_value(
            value: bytes | None,
            _: Col,
            __: BaseDatabaseWrapper
    ) -> pd.DataFrame:
        if value is None:
            return pd.DataFrame()

        try:
            return pickle.loads(value)
        except pickle.UnpicklingError:
            return pd.DataFrame()

    @override
    def to_python(
            self: Self,
            value: pd.DataFrame | None | str
    ) -> pd.DataFrame:
        if isinstance(value, pd.DataFrame):
            return value

        if value is None:
            return pd.DataFrame()

        return pickle.loads(
            super().to_python(value)
        )

    @override
    def get_prep_value(
            self: Self,
            value: pd.DataFrame
    ) -> str | None:
        return super().get_prep_value(
            pickle.dumps(
                obj=value,
                protocol=pickle.HIGHEST_PROTOCOL
            )
        )
