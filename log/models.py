from django.core.files import File
from django.db import models
import datetime


'''Log class with user analytics log,
created after pushing the analyze button and
stores the data of the analysis'''
class Log(models.Model):
    range_start = models.DateField()
    range_end = models.DateField()
    strategy = models.ForeignKey(
        'strategy.Strategy',
        on_delete=models.CASCADE
    )
    portfolio = models.ForeignKey(
        'portfolio.Portfolio',
        on_delete=models.CASCADE
    )
    logs = models.JSONField()
    slug = models.SlugField(
        max_length=255,
        unique=True,
        db_index=True,
    )

    def get_price_deltas(self):
        return {
            'balance': {
                'percent': round(self.logs[-1]['cost'] / self.logs[0]['cost'] - 1, 2) * 100,
                'currency': round(self.logs[-1]['cost'] - self.logs[0]['cost'], 2)
            },
            'stocks': self.portfolio.stocks_price_deltas(
                self.range_start,
                self.range_end
            )
        }

    def get_stocks_quotes(self):
        return self.portfolio.get_all_quotes(
            self.range_start,
            self.range_end
        )

    def save(self, **kwargs):
        if not self.logs:
            self.logs = self.strategy.buy_or_sell(
                self.portfolio,
                self.range_start,
                self.range_end,
            )
        if not self.slug:
            self.slug = f'log_{datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")}'
        super(Log, self).save(**kwargs)


# Image class to attach multiple images to one model
class Image(models.Model):
    image = models.ImageField(
        upload_to='plots/%Y/%m/%d/%H/%M/%S'
    )

    def attach_image(self, filename):
        self.image.save(
            filename,
            File(open(f'ui/business_logic/{filename}', 'rb'))
        )
        self.save()
