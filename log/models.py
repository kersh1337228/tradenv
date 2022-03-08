from django.core.files import File
from django.db import models
import datetime


'''Log class with user analytics log,
created after pushing the analyze button and
stores the data of the analysis'''
class Log(models.Model):
    time_interval_start = models.DateField()
    time_interval_end = models.DateField()
    price_deltas = models.JSONField()
    strategy = models.ForeignKey(
        'Strategy',
        on_delete=models.CASCADE
    )
    portfolio = models.ForeignKey(
        'quotes.Portfolio',
        on_delete=models.CASCADE
    )
    balance_plot = models.ImageField(
        upload_to='plots/%Y/%m/%d/%H/%M/%S'
    )
    stocks_quotes = models.JSONField()
    slug = models.SlugField(
        max_length=255,
        unique=True,
        db_index=True,
    )

    def save(self, **kwargs):
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
