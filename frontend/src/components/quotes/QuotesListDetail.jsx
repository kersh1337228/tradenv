import React from 'react'
import {Link} from 'react-router-dom'


export default class QuotesListDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            symbol: props.quotes.symbol,
            name: props.quotes.name,
            downloaded: props.quotes.downloaded,
        }
        // Methods binding
        this.check_quotes = this.check_quotes.bind(this)
    }

    async check_quotes() {
        if (!this.state.downloaded) {
            let current = this
            await $.ajax({
                url: `${window.location.origin}/quotes/detail/${this.state.slug}/`,
                type: 'GET',
                data: {
                    symbol: this.state.symbol,
                    name: this.state.name,
                },
                success: function () {
                    current.setState({
                        downloaded: true
                    })
                },
                error: function (response) {}
            })
        }
    }

    render() {
        // Add router here
        return(
            <Link to={'/quotes/detail/' + this.state.slug + '/'} onClick={this.check_quotes}>
                <div className={
                    this.state.downloaded ? 'quotes_list_details_downloaded' : 'quotes_list_details'
                }><ul>
                    <li className="quotes_list_detail_symbol">{this.state.symbol}</li>
                    <li className="quotes_list_detail_name">{this.state.name}</li>
                </ul></div>
            </Link>
        )
    }
}
