type JSONResponse = {
    data: Record<string, any>;
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    headers: Record<string, any>;
    redirected: boolean;
    bodyUsed: boolean;
};

type Quotes = {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type StockPartial = {
    symbol: string;
    name: string;
    type: string;
    country: string;
    exchange: string;
    last_updated: string;
    last_timestamp: string;
    tendency: {
        change: number;
        change_percent: number;
        quotes: QuotesType;
    };
};

interface Stock extends StockPartial {
    quotes: Quotes[];
}

type StockInstance = {
    stock: StockPartial;
    amount: number;
    priority: number;
};

type PortfolioMixin = {
    slug: string;
    name: string;
    balance: number;
    created: string;
    last_updated: string;
};

interface PortfolioPartial extends PortfolioMixin {
    stocks_amount: number;
}

interface Portfolio extends PortfolioMixin {
    stocks: StockInstance[];
    long_limit: number;
    short_limit: number;
    buy_stop: number;
    sell_stop: number;
    buy_limit: number;
    sell_limit: number;
    stop_loss: number;
    take_profit: number;
}

type Args = {
    [key: string]: 'str' | 'int' | 'float'
        | 'list[str]' | 'list[int]' | 'list[float]'
        | string[] | number[]
};

type Strategy = {
    verbose_name: string;
    alias: string;
    args: Args;
};
