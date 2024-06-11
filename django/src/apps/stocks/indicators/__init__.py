from typing import (
    Self,
    Callable,
    Literal,
    override
)
import sys
import pkgutil
import inspect
from importlib import import_module
from abc import (
    ABC,
    abstractmethod
)
import pandas as pd
from src.utils.functions import signature


class Indicator(ABC):
    plots: dict[str, Literal['line', 'hist']] | None = None
    verbose_name: str | None = None
    separate: bool = False
    params: dict[str, str | tuple] = None

    @classmethod
    def as_instance(cls) -> 'Indicator':
        cls.params = cls.params or signature(cls.__call__)
        cls.plots = cls.plots or {cls.__name__: 'line'}
        cls.verbose_name = cls.verbose_name or cls.__name__
        return cls()

    @abstractmethod
    def __call__(
            self: Self,
            ohlcv: pd.DataFrame,
            *args,
            **kwargs
    ) -> pd.DataFrame:
        pass


def indicator(
        plots: dict[str, Literal['line', 'hist']] | None = None,
        verbose_name: str | None = None,
        separate: bool = False,
) -> Callable:
    def decorator(
            function: Callable[[pd.DataFrame, ...], pd.DataFrame]
    ) -> Callable[[pd.DataFrame, ...], pd.DataFrame]:
        class WrappedIndicator(Indicator):
            __name__ = function.__name__
            params = signature(function)

            @override
            def __call__(
                    self,
                    ohlcv: pd.DataFrame,
                    *args,
                    **kwargs
            ):
                return function(ohlcv, *args, **kwargs)

        WrappedIndicator.plots = plots or {function.__name__: 'line'}
        WrappedIndicator.verbose_name = verbose_name or function.__name__
        WrappedIndicator.separate = separate
        return WrappedIndicator.as_instance()

    return decorator


indicators = []
for pkg in pkgutil.iter_modules(__path__):
    module = import_module(f'.{pkg.name}', __name__)

    function_indicators = inspect.getmembers(
        module, lambda member: isinstance(member, Indicator)
    )
    for name_, value_ in function_indicators:
        indicators.append(name_)
        setattr(sys.modules[__name__], name_, value_)

    class_indicators = inspect.getmembers(
        module, lambda member: inspect.isclass(member)
        and issubclass(member, Indicator)
        and member != Indicator
    )
    for name_, value_ in class_indicators:
        indicators.append(name_)
        setattr(sys.modules[__name__], name_, value_.as_instance())


__all__ = (
    'Indicator',
    'indicator',
    *indicators
)
