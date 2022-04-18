import React from 'react'
import {Link} from 'react-router-dom'


export default class QuotesListDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            stock: props.quotes
        }
        // Methods binding
        this.check_quotes = this.check_quotes.bind(this)
    }

    async check_quotes() {
        // if (!this.state.downloaded) {
        //     let current = this
        //     await $.ajax({
        //         url: `${window.location.origin}/quotes/detail/${this.state.stock.slug}/`,
        //         type: 'GET',
        //         data: {
        //             symbol: this.state.stock.symbol,
        //             name: this.state.stock.name,
        //         },
        //         success: function () {
        //             current.setState({
        //                 downloaded: true
        //             })
        //         },
        //         error: function (response) {}
        //     })
        // }
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
