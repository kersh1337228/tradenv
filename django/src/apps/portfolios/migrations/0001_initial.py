# Generated by Django 5.0.6 on 2024-06-11 17:28

import django.core.validators
import django.db.models.deletion
import src.apps.portfolios.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('stocks', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.SlugField(max_length=279, primary_key=True, serialize=False)),
                ('currency', models.CharField(choices=src.apps.portfolios.models.get_currencies, default='USD', max_length=3)),
                ('balance', models.FloatField(validators=[django.core.validators.MinValueValidator(0.0)])),
            ],
            options={
                'ordering': ('currency',),
                'get_latest_by': '-currency',
            },
        ),
        migrations.CreateModel(
            name='Portfolio',
            fields=[
                ('id', models.SlugField(max_length=275, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, validators=[django.core.validators.RegexValidator(code='invalid_name', message='Portfolio name must satisfy: "^\\w+$"', regex='^\\w+$')])),
                ('currency', models.CharField(choices=src.apps.portfolios.models.get_currencies, default='USD', max_length=3)),
                ('is_snapshot', models.BooleanField(default=False)),
                ('long_limit', models.PositiveSmallIntegerField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('short_limit', models.PositiveSmallIntegerField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ('buy_stop', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('sell_stop', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('buy_limit', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('sell_limit', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('stop_loss', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('take_profit', models.FloatField(blank=True, default=None, null=True, validators=[django.core.validators.MinValueValidator(1.0)])),
                ('create_time', models.DateTimeField(auto_now_add=True)),
                ('update_time', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ('is_snapshot', 'name'),
                'get_latest_by': '-name',
            },
        ),
        migrations.CreateModel(
            name='StockInstance',
            fields=[
                ('id', models.SlugField(max_length=296, primary_key=True, serialize=False)),
                ('amount', models.PositiveSmallIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ('priority', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ],
            options={
                'ordering': ('-priority',),
                'get_latest_by': '-priority',
            },
        ),
        migrations.AddConstraint(
            model_name='portfolio',
            constraint=models.UniqueConstraint(condition=models.Q(('is_snapshot', False)), fields=('name', 'is_snapshot'), name='unique_non_snapshot'),
        ),
        migrations.AddField(
            model_name='account',
            name='portfolio',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='portfolios.portfolio'),
        ),
        migrations.AddField(
            model_name='stockinstance',
            name='portfolio',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='portfolios.portfolio'),
        ),
        migrations.AddField(
            model_name='stockinstance',
            name='stock',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='stocks.stock'),
        ),
        migrations.AlterUniqueTogether(
            name='account',
            unique_together={('portfolio', 'currency')},
        ),
        migrations.AlterUniqueTogether(
            name='stockinstance',
            unique_together={('stock', 'portfolio')},
        ),
    ]