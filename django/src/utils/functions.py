from typing import (
    Callable,
    Literal,
    get_origin,
    get_args
)
import functools
import inspect
import pandas as pd


__all__ = (
    'paginate',
    'index_intersection',
    'type_replacer',
    'signature'
)


def paginate(
    count: int,
    current_page: int,
    limit: int = 50,
    pages: int = 5
) -> dict | None:
    pages_amount = count // limit + bool(count % limit)

    if current_page <= 0 or current_page > pages_amount:
        return {
            'page_numbers': [],
            'no_further': True,
            'no_back': True,
            'current_page': current_page
        }
    else:
        return {
            'page_numbers': list(
                range(1, pages_amount + 1)
            )[slice(
                current_page - pages if current_page >= pages else 0,
                current_page + pages - 1
            )],
            'no_further': current_page == pages_amount,
            'no_back': current_page == 1,
            'current_page': current_page
        }


def index_intersection(
        dataframes: list[pd.DataFrame] | tuple[pd.DataFrame, ...]
) -> pd.DatetimeIndex:
    return functools.reduce(
        lambda i, df: i.intersection(df.index),
        dataframes[1:],
        dataframes[0].index
    )


def type_replacer(
        t: type
) -> str | tuple | None:
    if t in (int, float, bool, str):
        return t.__name__

    origin = get_origin(t)
    if origin == Literal:
        return get_args(t)

    if origin == list:
        return str(t)


def signature(
        function: Callable
) -> dict[str, str | tuple]:
    sign = inspect.signature(function)
    params = tuple(sign.parameters.items())[1:]
    return dict(map(lambda param: (
        param[0],
        type_replacer(param[1].annotation)
    ), params))
