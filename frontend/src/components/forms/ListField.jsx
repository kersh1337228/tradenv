import React from 'react'
import {dtype_to_field} from './utils'


export default class AnalysisForm extends React.Component {  // Dynamically resizable list input
    constructor(props) { // Initialization
        super(props)
        this.state = {
            amount: 2  // Nested inputs amount
        }
    }

    render() {
        return(
            <fieldset name={this.props.name}>
                {[...Array(this.state.amount).keys()].map(number =>
                    <div key={number}>
                        {dtype_to_field(`${this.props.name}_${number}`, this.props.type)}
                    </div>
                )}
                <span onClick={() => {
                    this.setState({amount: this.state.amount + 1})
                }}>+</span>
                {this.state.amount !== 2 ? <span onClick={() => {
                    this.setState({amount: this.state.amount !== 2 ?
                            this.state.amount - 1 : this.state.amount})
                }}>-</span> : null}
            </fieldset>
        )
    }
}