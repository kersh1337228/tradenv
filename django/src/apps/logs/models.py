from typing import (
    Self,
    override
)
from django.db import models
from django.core import validators
from src.utils import fields
from src.apps.stocks.models import timeframes


class Log(models.Model):
    id = models.SlugField(
        max_length=275,
        primary_key=True
    )

    # Strategies and parameters used
    strategies = models.JSONField()

    portfolio = models.OneToOneField(
        'portfolios.Portfolio',
        on_delete=models.CASCADE
    )

    range_start = models.DateTimeField()
    range_end = models.DateTimeField()
    timeframe = models.CharField(
        max_length=3,
        choices=timeframes
    )
    commission = models.FloatField(
        validators=(
            validators.MinValueValidator(0.0),
            validators.MaxValueValidator(1.0)
        ),
        default=0.0,
        null=False,
        blank=True
    )
    mode = models.PositiveSmallIntegerField(
        default=0,
        null=False,
        blank=True
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
            self.id = self.portfolio_id

        super().save(
            force_insert=False,
            force_update=False,
            using=None,
            update_fields=None
        )

    class Meta:
        get_latest_by = '-update_time'
        order_with_respect_to = 'portfolio'
