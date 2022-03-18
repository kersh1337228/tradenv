import React from 'react'


export default class Pagination extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            pagination: props.pagination
        }
        // Methods binding
    }

    render() {
        return(
            <ul className={'pagination'}>
                {this.state.pagination.no_back ? null : <li>
                    <a href={"?page=" + (this.state.pagination.current_page - 1)}>{'<<'}</a>
                </li>}
                {this.state.pagination.page_numbers.map(
                    number => number !== this.state.pagination.current_page ?
                        <li className={'pagination_page'} key={number}>
                            <a href={'?page=' + number}>{number}</a>
                        </li> :
                        <li className={'pagination_page_current'} key={number}>{number}</li>
                )}
                {this.state.pagination.no_further ? null : <li>
                    <a href={"?page=" + (this.state.pagination.current_page + 1) }>{'>>'}</a>
                </li>}
            </ul>
        )
    }
}