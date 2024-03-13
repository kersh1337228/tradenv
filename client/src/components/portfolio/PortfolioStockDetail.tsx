import React from 'react'
import {Link} from 'react-router-dom'
import {StockInstanceType} from "../../types/quotes";

interface PortfolioStockDetailProps {
    stock: StockInstanceType
    alter: Function
    remove: Function
}

interface PortfolioStockDetailState {
    config: boolean,
    errors: {
        [key: string]: string[]
    }
}

export default class PortfolioStockDetail extends React.Component<
    PortfolioStockDetailProps,
    PortfolioStockDetailState
> {
    private readonly priorityRef: React.RefObject<HTMLInputElement>
    private readonly amountRef: React.RefObject<HTMLInputElement>
    public constructor(props: any) {
        super(props)
        this.state = {
            config: false,
            errors: {}
        }
        this.priorityRef = React.createRef()
        this.amountRef = React.createRef()
    }
    alter() {
        this.props.alter(
            this,
            this.priorityRef.current?.valueAsNumber,
            this.amountRef.current?.valueAsNumber
        )
    }
    remove() {
        if (confirm(
            `Do you really want to remove the ${
                this.props.stock.quotes.symbol
            } stock from this portfolio?`
        )) {
            this.props.remove(this.props.stock.quotes.symbol)
        }
    }
    public render(): React.ReactElement {
        return (
            <tr className="portfolio_stock_detail">
                <td className="portfolio_stock_detail_symbol">
                    {this.state.config ?
                        <>{'priority' in this.state.errors ? <tr>
                            {this.state.errors.priority.map(error =>
                                <td key={error}>{error}</td>
                            )}
                        </tr> : null}
                            <input
                                name={'priority'} type={'number'}
                                min={1} defaultValue={this.props.stock.priority}
                                ref={this.priorityRef}
                            /></> :
                        this.props.stock.priority
                    }
                </td>
                <td className="portfolio_stock_detail_symbol">
                    {this.props.stock.quotes.symbol}
                </td>
                <td className="portfolio_stocks_detail_name">
                    <Link to={'/quotes/detail/' + this.props.stock.quotes.symbol}>
                        {this.props.stock.quotes.name}
                    </Link>
                </td>
                <td className="portfolio_stock_detail_amount">
                    {this.state.config ?
                        <>{'amount' in this.state.errors ? <tr>
                            {this.state.errors.amount.map(error =>
                                <td key={error}>{error}</td>
                            )}
                        </tr> : null}
                            <input
                                name={'amount'} type={'number'}
                                min={0} defaultValue={this.props.stock.amount}
                                ref={this.amountRef}
                            /></> :
                        this.props.stock.amount
                    }
                </td>
                <td className="quotes_list_detail_price">
                    {this.props.stock.quotes.tendency.quotes.close}
                </td>
                <td className="quotes_list_detail_change">
                    {this.props.stock.quotes.tendency.change}
                </td>
                <td className="quotes_list_detail_change_percent">
                    {this.props.stock.quotes.tendency.change_percent}
                </td>
                <td className="quotes_list_detail_volume">
                    {this.props.stock.quotes.tendency.quotes.volume}
                </td>
                <td className="quotes_list_detail_volume">
                    {this.props.stock.quotes.tendency.quotes.volume}
                </td>
                <td className="quotes_list_detail_last_update">
                    {this.props.stock.quotes.last_timestamp}
                </td>
                <td className="portfolio_stock_detail_edit_menu">
                    <button onClick={() => {
                        this.setState({
                            config: false
                        })}}>Cancel
                    </button>
                    <button onClick={this.alter}>Confirm</button>
                </td>
            </tr>
        )
    }
}
