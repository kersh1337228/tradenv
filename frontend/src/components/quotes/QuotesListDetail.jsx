import React from 'react'
import {Link} from 'react-router-dom'


export default class QuotesListDetail extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        // Add router here
        return(
            <Link to={'/quotes/detail/' + this.props.quotes.symbol}>
                <div className={'quotes_list_details'}><ul>
                    <li className="quotes_list_detail_symbol">{this.props.quotes.symbol}</li>
                    <li className="quotes_list_detail_name">{this.props.quotes.name}</li>
                </ul></div>
            </Link>
        )
    }
}
