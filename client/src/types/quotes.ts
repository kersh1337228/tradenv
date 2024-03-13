export interface QuotesType {
    date: string,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number
}

export interface StockQuotesLiteType {
    symbol: string,
    name: string,
    type: string,
    country: string,
    exchange: string,
    last_updated: string,
    last_timestamp: string,
    tendency: {
        change: number,
        change_percent: number,
        quotes: QuotesType
    }
}

export interface StockQuotesType extends StockQuotesLiteType {
    quotes: QuotesType[]
}

export interface StockInstanceType {
    quotes: StockQuotesLiteType,
    amount: number,
    priority: number
}
