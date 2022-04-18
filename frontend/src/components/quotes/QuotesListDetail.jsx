import React from 'react'
import {Link} from 'react-router-dom'


export default class QuotesListDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            stock: props.quotes
        }
    }

    render() {
        // Add router here
        return(
            <Link to={'/quotes/detail/' + this.state.stock.slug + '/'} onClick={this.check_quotes}>
                <div className={'quotes_list_details'}><ul>
                    <li className="quotes_list_detail_symbol">{this.state.stock.symbol}</li>
                    <li className="quotes_list_detail_name">{this.state.stock.name}</li>
                </ul></div>
            </Link>
        )
    }
}
