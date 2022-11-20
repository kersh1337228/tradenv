import {PortfolioType} from "./portfolio"
import {QuotesType} from "./quotes";

export interface LogType {
    logs: {
        strategy: string,
        data: {
            date: string,
            value: number,
            balance: number,
            stocks: {
                [key: string]: number
            },
        }[]
    }[]
    range_start: string
    range_end: string
    portfolio: PortfolioType
    strategies: {
        [key: string]: {
            [key: string]: any
        }
    }
    price_deltas: {
        balance: {
            strategy: string,
            percent: number,
            currency: number
        }[],
        stocks: {
            symbol: string,
            name: string,
            percent: number,
            currency: number
        }[]
    }
    stocks_quotes: {
        [key: string]: QuotesType[]
    }
    slug: string
}