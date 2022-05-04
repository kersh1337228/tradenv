import datetime
import pandas
import copy


# Simple strategy buy or sell
def simple_buy_or_sell(self, portfolio, range_start, range_end):
    # Creating convenient date range
    date_range = pandas.date_range(
        datetime.datetime.strptime(range_start, '%Y-%m-%d'),
        datetime.datetime.strptime(range_end, '%Y-%m-%d'),
    )
    # Getting portfolio stocks quotes for given period
    portfolio_quotes = portfolio.get_all_quotes(range_start, range_end, 'analysis')
    # Counting general portfolio cost
    def set_cost(log):
        return log['balance'] + sum([
            amount * portfolio_quotes[name][
                datetime.datetime.strptime(log['date'], '%Y-%m-%d')
            ]['close']
            for name, amount in log['stocks'].items()
        ])
    # Initial log
    logs = [{
        'date': date_range[2].strftime('%Y-%m-%d'),
        'balance': portfolio.balance,
        'stocks': dict.fromkeys(portfolio_quotes.keys(), 0),
        'cost': portfolio.balance,
    }]
    # Logging through dates and portfolio stocks
    for date in range(len(date_range) - 3):  # add date offset
        log = copy.deepcopy(logs[-1])  # current log
        for name, period_quotes in portfolio_quotes.items():
            for delta in range(3):  # strategy research interval
                # Comparison quotes
                quotes = period_quotes[date_range[date + delta]]['close']
                # Current date quotes
                current = period_quotes[date_range[date + 3]]['close']
                # Overall stocks amount in portfolio
                stocks_amount = sum(log['stocks'].values())
                # Buy signal
                if all((
                    current > quotes,
                    stocks_amount + 1 <= self.long_limit,
                    log['balance'] >= current
                )):
                    log['stocks'][name] += 1
                    log['balance'] -= current
                # Sell signal
                elif all((
                        current < quotes,
                        stocks_amount - 1 >= -self.short_limit
                )):
                    log['stocks'][name] -= 1
                    log['balance'] += current
        # Finishing log
        log['date'] = date_range[date + 3].strftime('%Y-%m-%d')
        log['cost'] = set_cost(log)
        logs.append(log)
    return logs
