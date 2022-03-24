import datetime


# Simple strategy buy or sell
def simple_buy_or_sell(self, portfolio_image, index, date):
    for delta in range(3):
        quote = portfolio_image.stocks[index].origin.quotes[(
                date + datetime.timedelta(days=delta)
        ).strftime('%Y-%m-%d')]['close']
        current = portfolio_image.stocks[index].origin.quotes[
            (date + datetime.timedelta(days=3)).strftime('%Y-%m-%d')
        ]['close']
        if current > quote and portfolio_image.stocks[index].amount + 1 <= self.long_limit \
                and portfolio_image.balance >= current:
            portfolio_image.stocks[index].amount += 1
            portfolio_image.balance -= current
        elif current < quote and portfolio_image.stocks[index].amount - 1 >= self.short_limit:
            portfolio_image.stocks[index].amount -= 1
            portfolio_image.balance += current
    portfolio_image.set_cost((date + datetime.timedelta(days=3)).strftime('%Y-%m-%d'))
    return portfolio_image
