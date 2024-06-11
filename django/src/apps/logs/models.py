from typing import (
    Self,
    override
)
from django.db import models
from src.utils import fields
from src.apps.stocks.models import timeframes


class Log(models.Model):
    id = models.SlugField(
        max_length=275,
        primary_key=True
    )

    range_start = models.DateTimeField()
    range_end = models.DateTimeField()
    timeframe = models.CharField(
        max_length=3,
        choices=timeframes
    )

    strategies = models.JSONField()  # Strategies and parameters used
    portfolio = models.OneToOneField(
        'portfolios.Portfolio',
        on_delete=models.CASCADE
    )
    logs = fields.DataFrameField()

    create_time = models.DateTimeField(
        auto_now_add=True
    )

    @override
    def save(
            self: Self,
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
    ) -> None:
        if not self.pk:
            self.slug = self.portfolio.id

        super().save(
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
        )

    class Meta:
        get_latest_by = '-update_time'
        order_with_respect_to = 'portfolio'
