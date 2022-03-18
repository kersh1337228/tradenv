import React from 'react'


export default class Plot extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: props.data,
        }
    }

    render() {
        return(
            <canvas>Plot will be here</canvas>
        )
    }
}