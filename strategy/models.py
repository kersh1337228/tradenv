from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from log.models import Log
from strategy.utils import simple_buy_or_sell


'''Strategy model, where strategy is basically what to do 
when getting the 'good' and 'bad' analytics result,
how much of shares can be in the briefcase at the same time and
how much shares can we borrow'''


class Strategy(models.Model):
    name = models.CharField(
        max_length=255,
        verbose_name='Strategy name',
        unique=True
    )
    long_limit = models.PositiveSmallIntegerField(
        verbose_name='Shares amount limit to store',
        validators=[
            MinValueValidator(0),
            MaxValueValidator(32767)
        ]
    )
    short_limit = models.PositiveSmallIntegerField(
        verbose_name='Shares amount limit to borrow',
        validators=[
            MinValueValidator(0),
            MaxValueValidator(32767)
        ]
    )
    created = models.DateTimeField(
        auto_now_add=True,
    )
    last_updated = models.DateTimeField(
        auto_now=True,
    )
    buy_or_sell = simple_buy_or_sell
    slug = models.SlugField(
        max_length=255,
        unique=True,
        db_index=True,
    )

    def save(self, **kwargs):
        if not self.slug or self.slug != self.name.replace(' ', '_').lower():
            self.slug = self.name.replace(' ', '_').lower()
        self.buy_or_sell = kwargs.get('buy_or_sell') \
            if kwargs.get('buy_or_sell') else self.buy_or_sell
        super(Strategy, self).save()
