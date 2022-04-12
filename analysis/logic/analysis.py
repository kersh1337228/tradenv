import os
import datetime
import numpy
import pandas
import matplotlib.pyplot as plt
import matplotlib.gridspec as grd
import matplotlib.dates as mdates
import mplfinance


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
