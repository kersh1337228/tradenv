from src.apps.strategies.strategies import (
    strategy,
    Environment
)


@strategy(
    verbose_name='Simple Periodic'
)
def simple_periodic(
        env: Environment,
        period_length: int = 3,
) -> None:
    for timestamp, _ in env:
        current_timestamp = timestamp + period_length * env.range.freq
        for symbol in env.symbols:
            period_quotes = env.quotes.loc[symbol, 'close']
            current = period_quotes.loc[current_timestamp]
            for delta in range(period_length):
                prev = period_quotes.loc[timestamp + delta * env.range.freq]
                if current > prev:
                    env.buy(symbol, 1)
                elif current < prev:
                    env.sell(symbol, 1)
