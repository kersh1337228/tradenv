import React from 'react'


export default class Pagination extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return(
            <ul className={'pagination'}>
                {
                    this.props.pagination.no_back ?
                        null :
                        <li>
                            <a href={`?page=${this.props.pagination.current_page - 1}`}>
                                {'<<'}
                            </a>
                        </li>
                }
                {this.props.pagination.page_numbers.map(
                    number => number !== this.props.pagination.current_page ?
                        <li className={'pagination_page'} key={number}>
                            <a href={`?page=${number}`}>
                                {number}
                            </a>
                        </li> :
                        <li className={'pagination_page_current'} key={number}>
                            {number}
                        </li>
                )}
                {
                    this.props.pagination.no_further ?
                        null :
                        <li>
                            <a href={`?page=${this.props.pagination.current_page + 1}`}>
                                {'>>'}
                            </a>
                        </li>
                }
            </ul>
        )
    }
}