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

type OHLCV = {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type PaginationType = {
    page_numbers: number[];
    no_further: boolean;
    no_back: boolean;
    current_page: number;
};

type StockType = 'stock' | 'etf' | 'fund' | 'futures'
    | 'forex' | 'index' | 'bond' | 'option' | 'crypto';

type Stock = {
    symbol: string;
    name?: string;
    type: StockType;
    exchange?: string;
    exchange_name?: string;
    timezone: string;
    country: string;
    currency: string;
    sector?: string;
    industry?: string;
    quotes: {
        timeframe: string;
        update_time: string;
    }[];
};

type Quotes = {
    ohlcv: OHLCV[];
    timeframe: string;
    update_time: string;
    tendency: {
        abs: number;
        rel: number;
        ohlcv: OHLCV;
    }
};

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
