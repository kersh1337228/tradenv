type BasicType = 'int' | 'float' | 'str' | 'bool'
    | 'list[int]' | 'list[float]' | 'list[str]' | 'list[bool]'
    | number[] | string[];
type BasicValue = number | string | boolean | null
    | number[] | string[] | boolean[];
type FormField = HTMLInputElement |  HTMLSelectElement | HTMLFieldSetElement;

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

type StockObject = {
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

type QuotesObject = {
    ohlcv: OHLCV[];
    timeframe: string;
    update_time: string;
    tendency: {
        abs: number;
        rel: number;
        ohlcv: OHLCV;
    }
};

type IndicatorAvailable = {
    params: Record<string, BasicType>;
    verbose_name: string;
    plots: Record<string, 'line' | 'hist'>;
    separate: boolean;
}

type Indicator = {
    name: string;
    params: Record<string, BasicValue>;
    verbose_name: string;
    data: Record<string, [string, number | null][] | {
        timestamp: string;
        [key: string]: any;
    }[]>;
}

type StockInstance = {
    id: string;
    stock: StockObject;
    amount: number;
    priority: number;
};

type Account = {
    id: string;
    currency: string;
    balance: number;
};

type PortfolioPartial = {
    id: string;
    name: string;
    currency: string;
    create_time: string;
    update_time: string;
};

interface Portfolio extends PortfolioPartial {
    long_limit: number | null;
    short_limit: number | null;
    accounts: Account[];
    stocks: StockInstance[];
    logs: LogPartial[];
}

type LogPartial = {
    id: string;
    strategies: string[];
    portfolio: string;
    create_time: string;
};

type Result = {
    abs: number;
    rel: number;
    avg_loss: number;
    max_loss: number;
    avg_profit: number;
    max_profit: number;
    pli: number;
};

type Log = {
    id: string;
    strategies: [string, Record<string, BasicValue>][];
    portfolio: Portfolio;
    range_start: string;
    range_end: string;
    timeframe: string;
    commission: number;
    mode: number;
    logs: Record<string, {
        timestamp: string;
        value: number;
        rel: number;
        [currencyOrSymbol: string]: number;
    }[]>;
    create_time: string;
    results: {
        strategies: Record<string, Result>;
        stocks: Record<string, Result>;
    };
    quotes: Record<string, OHLCV[]>;
};

type Strategy = {
    verbose_name?: string;
    params: BasicType;
};
