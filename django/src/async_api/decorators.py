from functools import (
    partial,
    update_wrapper,
    wraps
)


__all__ = (
    'async_method_decorator',
)


def _update_method_wrapper(
        wrapper,
        decorator
):
    @decorator
    def dummy(*_, **__) -> None:
        pass

    update_wrapper(
        wrapper=wrapper,
        wrapped=dummy
    )


def _multi_decorate(
        decorators,
        method
):
    if hasattr(decorators, "__iter__"):
        decorators = decorators[::-1]
    else:
        decorators = [decorators]

    async def _wrapper(
            self,
            *args,
            **kwargs
    ):
        bound_method = wraps(method)(partial(method.__get__(self, type(self))))
        for dec_ in decorators:
            bound_method = dec_(bound_method)
        return await bound_method(*args, **kwargs)

    for dec in decorators:
        _update_method_wrapper(_wrapper, dec)

    update_wrapper(_wrapper, method)
    return _wrapper


def async_method_decorator(
        decorator,
        name: str = ''
):
    def _dec(obj_):
        if not isinstance(obj_, type):
            return _multi_decorate(decorator, obj_)
        if not (name and hasattr(obj_, name)):
            raise ValueError(
                "The keyword argument `name` must be the name of a method "
                "of the decorated class: %s. Got '%s' instead." % (obj_, name)
            )
        method = getattr(obj_, name)
        if not callable(method):
            raise TypeError(
                "Cannot decorate '%s' as it isn't a callable attribute of "
                "%s (%s)." % (name, obj_, method)
            )
        _wrapper = _multi_decorate(decorator, method)
        setattr(obj_, name, _wrapper)
        return obj_

    if not hasattr(decorator, "__iter__"):
        update_wrapper(_dec, decorator)

    obj = decorator if hasattr(decorator, "__name__") else decorator.__class__
    _dec.__name__ = "method_decorator(%s)" % obj.__name__
    return _dec
