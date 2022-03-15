import React from 'react'
import {Link} from 'react-router-dom'


export default class QuotesListDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            symbol: props.quotes.symbol,
            name: props.quotes.name,
            slug: props.quotes.slug,
            price: props.quotes.price,
            change: props.quotes.change,
            change_percent: props.quotes.change_percent,
            volume: props.quotes.volume,
            downloaded: props.quotes.downloaded,
        }
        // Methods binding

    }

    render() {
        // Add router here
        return(
            <Link to={'/quotes/detail/' + this.state.slug}>
                <div className={
                    this.state.downloaded ? 'quotes_list_details_downloaded' : 'quotes_list_details'
                }><ul>
                    <li className="quotes_list_detail_symbol">{this.state.symbol}</li>
                    <li className="quotes_list_detail_name">{this.state.name}</li>
                    <li className="quotes_list_detail_price">{this.state.price}</li>
                    <li className="quotes_list_detail_change">{this.state.change}</li>
                    <li className="quotes_list_detail_change_percent">{this.state.change_percent}</li>
                    <li className="quotes_list_detail_volume">{this.state.volume}</li>
                </ul></div>
            </Link>
        )
    }
}
