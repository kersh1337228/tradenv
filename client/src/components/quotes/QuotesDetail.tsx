import React from 'react'
import PlotFinancial from "../plots/PlotFinancial/PlotFinancial"
import {StockQuotesType} from "../../types/quotes"
import {ajax} from "../../utils/functions";

interface QuotesDetailState {
    quotes: StockQuotesType | null
}

export default class QuotesDetail extends React.Component<any, QuotesDetailState> {
    public constructor(props: any) {
        super(props)
        this.state = {
            quotes: null,
        }
    }
    public async componentDidMount(): Promise<void> {
        const symbol = window.location.href.match(
            /\/quotes\/detail\/(?<symbol>[\w]+)/
        )?.groups?.symbol
        await ajax(
            `http://localhost:8000/quotes/api/detail/${symbol}`,
            'GET',
            (response: {quotes: StockQuotesType}) => {
                this.setState({
                    quotes: response.quotes,
                })
            }
        )
    }
    public render(): React.ReactElement {
        if (this.state.quotes) {
            return(
                <div className="quotes_detail">
                    <h1 className="quotes_detail_name">{this.state.quotes.name}</h1>
                    <h1 className="quotes_detail_symbol">{this.state.quotes.symbol}</h1>
                    <h3 className="quotes_detail_last_quotes">Last quotes</h3>
                    <table>
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Open</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Close</th>
                            <th>Volume</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{this.state.quotes.tendency.quotes.date}</td>
                            <td>{this.state.quotes.tendency.quotes.open}</td>
                            <td>{this.state.quotes.tendency.quotes.high}</td>
                            <td>{this.state.quotes.tendency.quotes.low}</td>
                            <td>{this.state.quotes.tendency.quotes.close}</td>
                            <td>{this.state.quotes.tendency.quotes.volume}</td>
                        </tr>
                        </tbody>
                    </table>
                    <div className="quotes_price_plot">
                        <h3>Price change</h3>
                        <PlotFinancial
                            data={this.state.quotes.quotes}
                            symbol={this.state.quotes.symbol}
                        />
                    </div>
                </div>
            )
        } else {
            return(
                <div className="quotes_detail">
                    Loading...
                </div>
            )
        }
    }
}
