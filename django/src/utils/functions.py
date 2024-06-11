from typing import (
    Never,
    Iterable,
    Callable,
    Literal,
    get_origin,
    get_args
)
import functools
import inspect
from django.http import Http404
import pandas as pd


def paginate(
    count: int,
    current_page: int,
    limit: int = 50,
    pages: int = 5
) -> dict | Never:
    pages_amount = count // limit + bool(count % limit)

    if current_page <= 0 or current_page > pages_amount:
        raise Http404(f'Page with number {current_page} does not exist.')
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
        dataframes: Iterable[pd.DataFrame]
) -> pd.Index:
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
