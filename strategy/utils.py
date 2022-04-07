import datetime
import pandas


# Simple strategy buy or sell
def simple_buy_or_sell(self, portfolio, time_interval_start, time_interval_end):
    # Counting general portfolio cost
    def set_cost(log, quotes):
        cost = log['balance']
        for name, amount in log['stocks'].items():
            cost += amount * \
                    quotes[name][log['date']]['close']
        return cost
    # Creating convenient date range
    date_range = pandas.date_range(
        datetime.datetime.strptime(
            time_interval_start,
            '%Y-%m-%d'
        ),
        datetime.datetime.strptime(
            time_interval_end,
            '%Y-%m-%d'
        ),
    )
    # Getting portfolio stocks quotes for given period
    portfolio_quotes = portfolio.get_all_quotes( # all quotes for period
        time_interval_start,  # period start
        time_interval_end,  # period end
    )
    # Initial log
    logs = [{
        'date': date_range[2].strftime('%Y-%m-%d'),
        'balance': portfolio.balance,
        'stocks': {name: 0 for name in portfolio_quotes.keys()},
        'cost': portfolio.balance,
    }]
    # Logging through dates and portfolio stocks
    for date in date_range[:-3]:  # add date offset
        log = logs[-1]  # current log
        for name, period_quotes in portfolio_quotes.items():
            for delta in range(3):  # strategy research interval
                # Comparison quotes
                quotes = period_quotes[(
                        date + datetime.timedelta(days=delta)
                ).strftime('%Y-%m-%d')]['close']
                # Current date quotes
                current = period_quotes[(
                        date + datetime.timedelta(days=3)
                ).strftime('%Y-%m-%d')]['close']
                # Buy signal
                if current > quotes and log['stocks'][name] + 1 <= self.long_limit \
                        and log['balance'] >= current:
                    log['stocks'][name] += 1
                    log['balance'] -= current
                # Sell signal
                elif current < quotes and log['stocks'][name] - 1 >= self.short_limit:
                    log['stocks'][name] -= 1
                    log['balance'] += current
        log['date'] = (date + datetime.timedelta(days=3)).strftime('%Y-%m-%d')
        log['cost'] = set_cost(log, portfolio_quotes)
        logs.append(log)
    return logs
