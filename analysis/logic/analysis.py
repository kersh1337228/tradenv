import os
from copy import deepcopy
import datetime
import numpy
import pandas
import matplotlib.pyplot as plt
import matplotlib.gridspec as grd
import matplotlib.dates as mdates
import mplfinance
from django.core.files import File
from log.models import Log, Image


'''Copies the portfolio and stocks to allow the analyser
 function to change the data of the class 
 instance but not of the database'''
class PortfolioImage:
    class StockImage:
        def __init__(self, stock):
            self.origin = stock.origin
            self.amount = 0

    def __init__(self, portfolio):
        self.balance = portfolio.balance
        self.stocks = [
            self.StockImage(stock) for stock in portfolio.stocks.all()
        ]
        self.cost = self.balance

    # Balance in currency + stocks price
    # according to its close price by the date
    def set_cost(self, date):
        cost = self.balance
        for stocks in self.stocks:
            cost += stocks.amount * stocks.origin.quotes[date]['close']
        self.cost = cost

    def __str__(self):
        return str({
            'balance': self.balance,
            'stocks': [{
                'amount': stock.amount,
                'name': stock.origin.name
            } for stock in self.stocks],
            'cost': self.cost
        })


'''Analyser function, made to analyse the
 quotes data using different strategies'''
def analyse(portfolio, time_interval_start, time_interval_end, strategy):
    date_range = pandas.date_range(
        datetime.datetime.strptime(
            time_interval_start,
            '%Y-%m-%d'
        ),
        datetime.datetime.strptime(
            time_interval_end,
            '%Y-%m-%d'
        ) - datetime.timedelta(days=3),
    )  # Converting dates to date range
    logs = log(
        PortfolioImage(portfolio),
        date_range,
        strategy,
    )  # Analysing and logging
    log_instance = Log.objects.create(
        time_interval_start=time_interval_start,
        time_interval_end=time_interval_end,
        price_deltas={
            'balance': {
                'percent': round(logs[-1].cost / logs[0].cost - 1, 2) * 100,
                'currency': round(logs[-1].cost - logs[0].cost, 2)
            },
            'stocks': [
                {
                    'percent': round(stock.origin.quotes[time_interval_end]['close'] /
                                stock.origin.quotes[time_interval_start]['close'] - 1, 2) * 100,
                    'currency': round(
                        stock.origin.quotes[time_interval_end]['close'] -
                        stock.origin.quotes[time_interval_start]['close'], 2
                    )
                }
                for stock in portfolio.stocks.all()]
        },
        strategy=strategy,
        portfolio=portfolio,
    )  # Creating log model instance to save analysis data
    plot_builder(
        portfolio,
        date_range,
        logs,
    )  # Building balance change plot
    log_instance.balance_plot.save(
        'balance.png',
        File(open('ui/business_logic/balance.png', 'rb'))
    )  # Attaching balance change plot to log model instance
    # Deleting unnecessary plot picture
    os.remove('ui/business_logic/balance.png')
    # Building stock price ohlc candle plot
    for stock in portfolio.stocks.all():
        build_candle_plot(
            {date: stock.origin.quotes[date] for date in date_range},
            f'{stock.origin.name}.png'
        )  # Attaching stock price plot to log model instance
        image = Image.objects.create()
        image.attach_image(f'{stock.origin.name}.png')
        log_instance.stock_plots.add(image)
        os.remove(f'ui/business_logic/{stock.origin.name}.png')
    log_instance.save()  # Applying log model instance changes
    portfolio.logs.add(log_instance)  # Attaching log to the portfolio
    portfolio.save()
    return log_instance


'''Log function uses the strategy to analyse
 the portfolio on the chosen time period'''
def log(portfolio_image, date_range, strategy):
    # Taking class instance copy for further work with the original one,
    # not being afraid to change logged data
    logs = [deepcopy(portfolio_image)]
    for date in date_range:
        for index in range(len(portfolio_image.stocks)):
            portfolio_image = strategy.buy_or_sell(portfolio_image, index, date)
        logs.append(deepcopy(portfolio_image))
    return logs


'''Building the plot, showing the total savings amount and
stocks average_cost, depending on the time point'''
def plot_builder(portfolio, date_range, logs):
    # x-axis data (dates)
    dates_data = mdates.date2num(date_range.insert(
            0, date_range[0] - datetime.timedelta(days=1)
    ).to_pydatetime())
    # Creating balance and stocks amount figures and subplots
    fig = plt.figure()
    gridspec = grd.GridSpec(
        nrows=2, ncols=1, height_ratios=[3, 1], hspace=0
    )  # Building subplot grid
    balance_subplot = plt.subplot(gridspec[0])  # Balance subplot
    stocks_amount_subplot = plt.subplot(gridspec[1])  # Stocks amount subplot
    # Setting x-axis date format
    stocks_amount_subplot.xaxis.set_major_formatter(
        mdates.DateFormatter('%Y-%m-%d')
    )
    stocks_amount_subplot.xaxis.set_major_locator(
        mdates.DayLocator(interval=((date_range[-1] - date_range[0]).days // 6))
    )
    stocks_amount_subplot.xaxis.set_minor_locator(
        mdates.DayLocator()
    )
    for label in stocks_amount_subplot.get_xticklabels(which='major'):
        label.set(rotation=45, horizontalalignment='right')
    # Getting subplot lines
    balance_line = balance_subplot.plot(
        dates_data,
        numpy.array([log.cost for log in logs]),
        label='Balance',
        color='r'
    )
    stocks_lines = [stocks_amount_subplot.plot(
        dates_data,
        numpy.array([log.stocks[index].amount for log in logs]),
        label=f'{portfolio.stocks.all()[index].origin.name}'
    )[0] for index, stock in enumerate(portfolio.stocks.all())]
    # Setting vertical axes labels
    balance_subplot.set_ylabel('Balance')
    stocks_amount_subplot.set_ylabel('Amount')
    # Setting up legend
    leg = fig.legend(
        handles=stocks_lines,
        loc='upper right',
        facecolor='#161a1e',
        edgecolor='#161a1e',
        framealpha=1
    )  # Customising legend text color
    for text in leg.get_texts():
        text.set_color('#838d9b')
    # Deleting unnecessary borders
    balance_subplot.label_outer()
    stocks_amount_subplot.label_outer()
    # Figure color
    fig.set_facecolor('#161a1e')
    # Subplots foreground color
    balance_subplot.set_facecolor('#161a1e')
    stocks_amount_subplot.set_facecolor('#161a1e')
    # Subplots grid color
    balance_subplot.grid(color='#1a1e23')
    stocks_amount_subplot.grid(color='#1a1e23')
    # Subplots border colors
    balance_subplot.spines['bottom'].set_color('#838d9b')
    balance_subplot.spines['top'].set_color('#838d9b')
    balance_subplot.spines['left'].set_color('#838d9b')
    balance_subplot.spines['right'].set_color('#838d9b')
    stocks_amount_subplot.spines['bottom'].set_color('#838d9b')
    stocks_amount_subplot.spines['top'].set_color('#838d9b')
    stocks_amount_subplot.spines['left'].set_color('#838d9b')
    stocks_amount_subplot.spines['right'].set_color('#838d9b')
    # Subplots axe tick colors
    balance_subplot.tick_params(axis='x', colors='#838d9b')
    balance_subplot.tick_params(axis='y', colors='#838d9b')
    stocks_amount_subplot.tick_params(axis='x', colors='#838d9b')
    stocks_amount_subplot.tick_params(axis='y', colors='#838d9b')
    # Subplots label colors
    balance_subplot.xaxis.label.set_color('#838d9b')
    balance_subplot.yaxis.label.set_color('#838d9b')
    stocks_amount_subplot.xaxis.label.set_color('#838d9b')
    stocks_amount_subplot.yaxis.label.set_color('#838d9b')
    # Increasing bottom space below the plots
    plt.subplots_adjust(bottom=0.2)
    plt.savefig('ui/business_logic/balance.png', dpi=1200)
    plt.close()


'''Building quotes ohlc candle plot'''
def build_candle_plot(quotes, filename='plot.png'):
    # Formatting data
    quotes = {date: quote for date, quote in quotes.items()
              if not quote['non-trading']}
    data = pandas.DataFrame({
        'Open': [value['open'] for value in quotes.values()],
        'High': [value['high'] for value in quotes.values()],
        'Low': [value['low'] for value in quotes.values()],
        'Close': [value['close'] for value in quotes.values()],
        'Volume': [value['volume'] for value in quotes.values()],
    }, index=pandas.DatetimeIndex(quotes.keys()))
    # Creating and customising plot
    plot, axes = mplfinance.plot(
        data=data, type='candle',
        style=mplfinance.make_mpf_style(
            marketcolors=mplfinance.make_marketcolors(
                up='#0ecb81', down='#f6465d', edge='none',
                volume={'up': '#0ecb81', 'down': '#f6465d'},
                wick={'up': '#0ecb81', 'down': '#f6465d'},
            ),
            facecolor='#161a1e', edgecolor='#474d57',
            figcolor='#161a1e', gridcolor='#1a1e23',
        ),
        volume=True, returnfig=True
    )
    for axe in axes:  # Changing axes colors
        axe.tick_params(labelcolor='#838d9b')
        axe.set_ylabel(axe.get_ylabel(), color='#838d9b')
    plot.savefig(f'ui/business_logic/{filename}', dpi=1200)
    # Deleting unnecessary plot picture
    os.remove(f'ui/business_logic/{filename}')
