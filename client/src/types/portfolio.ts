import {StockInstanceType} from "./quotes"

export interface PortfolioLiteType {
    name: string
    balance: number
    created: string
    last_updated: string
    slug: string
    stocks_amount: number
}

export interface PortfolioType extends Omit<PortfolioLiteType, 'stocks_amount'> {
    stocks: StockInstanceType[]
    long_limit: number
    short_limit: number
    buy_stop: number
    sell_stop: number
    buy_limit: number
    sell_limit: number
    stop_loss: number
    take_profit: number
}

