from typing import (
    Self,
    override
)
import json
from rest_framework import renderers
from rest_framework.compat import (
    INDENT_SEPARATORS,
    LONG_SEPARATORS,
    SHORT_SEPARATORS
)


__all__ = (
    'JSONRenderer',
)


class JSONRenderer(renderers.JSONRenderer):
    @override
    def render(
            self: Self,
            data: dict | list | str | int | float | None,
            accepted_media_type: str | None = None,
            renderer_context: dict | None = None
    ) -> bytes:
        if data is None:
            return b''

        renderer_context = renderer_context or {}
        indent = self.get_indent(accepted_media_type, renderer_context)

        if indent is None:
            separators = SHORT_SEPARATORS if self.compact else LONG_SEPARATORS
        else:
            separators = INDENT_SEPARATORS

        ret = json.dumps(
            data, cls=self.encoder_class,
            indent=indent, ensure_ascii=self.ensure_ascii,
            allow_nan=True, separators=separators
        )

        ret = ret.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029').replace('NaN', 'null')
        return ret.encode()
