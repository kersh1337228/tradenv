import React from 'react'
import './PlotDateValue.css'


// Figure class containing main plot component data
class Figure {
    constructor(
        window_size_width,
        window_size_height,
        padding_left=0,
        padding_top=0,
        padding_right=0,
        padding_bottom=0,
        grid_vertical_amount=10,
        grid_vertical_color='#000000',
        grid_vertical_width=1,
        grid_horizontal_amount=10,
        grid_horizontal_color='#000000',
        grid_horizontal_width=1,
        canvas_density=1
    ) {
        this.window_size = {
            width: window_size_width,
            height: window_size_height,
        }
        this.scale = {
            width: 1,
            height: 1,
        }
        this.padding = {
            left: padding_left,
            top: padding_top,
            right: padding_right,
            bottom: padding_bottom
        }
        this.axes = {
            x: 0,
            y: 0,
        }
        this.grid = {
            vertical: {
                amount: grid_vertical_amount,
                color: grid_vertical_color,
                width: grid_vertical_width,
            },
            horizontal: {
                amount: grid_horizontal_amount,
                color: grid_horizontal_color,
                width: grid_horizontal_width,
            },
        }
        this.canvas = React.createRef()
        this.context = null
        this.canvas_density = canvas_density
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width * this.canvas_density
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height * this.canvas_density
    }
    set_window() {
        this.canvas.current.style.width = `${this.window_size.width}px`
        this.canvas.current.style.height = `${this.window_size.height}px`
        this.canvas.current.width = this.get_width()
        this.canvas.current.height = this.get_height()
    }
}


// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotDateValue extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        this.state = {
            figures: {
                main: new Figure(
                    850, 480,
                    0, 0.1, 0, 0.1,
                    10, '#d9d9d9', 1,
                    10, '#d9d9d9', 1,
                    1

                ),
                hit: new Figure(850, 480),
                dates: new Figure(850, 48, 0, 0.1),
                value: new Figure(48, 480)
            },
            tooltips: null,
            data_range: null,
        }  // Data amount indicator
        this.is_enough_data = props.data.every(
            log => Object.keys(log.data).length > 4
        )
        // Data range navigation
        this.drag = {
            main: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            },
            dates: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            }
        }
        // UI events binding
        //// Main canvas
        this.mouseMoveHandlerMain = this.mouseMoveHandlerMain.bind(this)
        this.mouseOutHandlerMain = this.mouseOutHandlerMain.bind(this)
        this.mouseDownHandlerMain = this.mouseDownHandlerMain.bind(this)
        this.mouseUpHandlerMain = this.mouseUpHandlerMain.bind(this)
        //// Dates canvas
        this.mouseMoveHandlerDates = this.mouseMoveHandlerDates.bind(this)
        this.mouseDownHandlerDates = this.mouseDownHandlerDates.bind(this)
        this.mouseUpHandlerDates = this.mouseUpHandlerDates.bind(this)
    }
    // Date-value type plot (<date:String>, <value:Number>)
    plot(callback) {
        let state = this.state
        // Clear
        state.figures.main.context.clearRect(
            0, 0,
            state.figures.main.get_width(),
            state.figures.main.get_height()
        )
        state.figures.dates.context.clearRect(
            0, 0,
            state.figures.dates.get_width(),
            state.figures.dates.get_height()
        )
        // Drawing grid on plot canvases
        this.show_grid(state.figures.main)
        // Curves colors
        const colors = [
            '#d14d00',
            '#000fca',
            '#5ec200',
            '#bb0000',
            '#8900ad',
            '#bb8b00',
            '#00a076',
        ]
        // Rescaling
        const [max_value, min_value, max_data_amount] = [
            Math.max.apply(
                null, this.props.data.map(
                    log => Math.max.apply(null, Array.from(
                        log.data.slice(
                            Math.floor(log.data.length * state.data_range.start),
                            Math.ceil(log.data.length * state.data_range.end)
                        ), obj => obj.value
                    ))
                )
            ),
            Math.min.apply(
                null, this.props.data.map(
                    log => Math.min.apply(null, Array.from(
                        log.data.slice(
                            Math.floor(log.data.length * state.data_range.start),
                            Math.ceil(log.data.length * state.data_range.end)
                        ), obj => obj.value
                    ))
                )
            ),
            Math.max.apply(
                null, this.props.data.map(
                    log => log.data.slice(
                        Math.floor(log.data.length * state.data_range.start),
                        Math.ceil(log.data.length * state.data_range.end)
                    ).length
                )
            )
        ]
        const spread = Math.abs(max_value - min_value)
        state.figures.main.scale.height = state.figures.main.get_height() *
            (1 - state.figures.main.padding.bottom - state.figures.main.padding.top) /
            spread
        state.figures.main.scale.width = state.figures.main.get_width() *
            (1 - state.figures.main.padding.left - state.figures.main.padding.right) /
            (max_data_amount - 1)
        // Moving coordinates system
        state.figures.main.axes.y = max_value * state.figures.main.scale.height +
            state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x = state.figures.main.padding.left * state.figures.main.get_width()
        // Drawing curves
        this.props.data.map((log, ind) => {
            // Getting observed data range
            const data = log.data.slice(
                Math.floor(log.data.length * state.data_range.start),
                Math.ceil(log.data.length * state.data_range.end)
            )
            const data_amount = data.length
            const values = Array.from(data, obj => obj.value)
            // Changing context
            state.figures.main.context.save()
            state.figures.main.context.translate(state.figures.main.axes.x, state.figures.main.axes.y)
            state.figures.main.context.scale(1, -state.figures.main.scale.height)
            // Drawing plot
            state.figures.main.context.beginPath()
            state.figures.main.context.moveTo(0, values[0])
            for (let i = 1; i < data_amount; ++i) {
                state.figures.main.context.lineTo(i * state.figures.main.scale.width, values[i])
            }
            state.figures.main.context.restore()
            state.figures.main.context.lineWidth = 2
            state.figures.main.context.strokeStyle = colors[ind]
            state.figures.main.context.stroke()
            state.figures.main.context.closePath()
            // Drawing legend
            state.figures.main.context.font = '12px Arial'
            state.figures.main.context.fillStyle = colors[ind]
            state.figures.main.context.fillText(
                log.strategy,
                15,
                state.figures.main.get_height() / this.props.data.length / 10 * (ind + 1)
            )
        })  // Restoring context
        // Drawing dates axis
        state.figures.dates.context.beginPath()
        state.figures.dates.context.strokeStyle = '#000000'
        state.figures.dates.context.moveTo(
            0,
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.lineTo(
            state.figures.dates.get_width(),
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.stroke()
        state.figures.dates.context.closePath()
        // Drawing data notches and dates
        const max_dates = this.props.data.filter(
            log => log.data.slice(
                Math.floor(log.data.length * state.data_range.start),
                Math.ceil(log.data.length * state.data_range.end)
            ).length === max_data_amount
        )[0].data
        let step = Math.ceil(max_data_amount * 0.1)
        for (let i = step; i < max_data_amount - step; i += step) {
            state.figures.dates.context.beginPath()
            state.figures.dates.context.moveTo(
                i * state.figures.main.scale.width,
                state.figures.dates.get_height() * state.figures.dates.padding.top
            )
            state.figures.dates.context.lineTo(
                i * state.figures.main.scale.width,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.1)
            )
            state.figures.dates.context.stroke()
            state.figures.dates.context.closePath()
            state.figures.dates.context.font = '10px Arial'
            state.figures.dates.context.fillText(
                max_dates[i].date,
                i * state.figures.main.scale.width - 25,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.3)
            )
        }
        // Drawing value scale
        step = spread / (state.figures.main.grid.vertical.amount - 2)
        for (let i = min_value; i <= max_value + step; i += step) {
            state.figures.value.context.beginPath()
            state.figures.value.context.moveTo(
                state.figures.value.get_width() * (1 - state.figures.value.padding.right),
                state.figures.value.get_height() * (
                    1 - (i - min_value) / step / state.figures.main.grid.vertical.amount *
                    state.figures.value.scale.height - state.figures.main.padding.bottom
                )
            )
            state.figures.value.context.lineTo(
                state.figures.value.get_width() * (0.9 - state.figures.value.padding.right),
                state.figures.value.get_height() * (
                    1 - (i - min_value) / step / state.figures.main.grid.vertical.amount *
                    state.figures.value.scale.height - state.figures.main.padding.bottom
                )
            )
            state.figures.value.context.stroke()
            state.figures.value.context.closePath()
            state.figures.value.context.font = '10px Arial'
            state.figures.value.context.fillText(
                `${Math.round((i / max_dates[0].value * 100 + Number.EPSILON) * 100) / 100}%`,
                state.figures.value.get_width() * 0.05,
                state.figures.value.get_height() * (
                    1 - (i - min_value) / step / state.figures.main.grid.vertical.amount *
                    state.figures.value.scale.height - state.figures.main.padding.bottom
                ) + 3
            )
        }
        this.setState(state, callback)
    }
    // Show translucent grid
    show_grid(figure) {
        const context = figure.context
        // Drawing horizontal
        context.lineWidth = figure.grid.horizontal.width * figure.canvas_density
        context.strokeStyle = figure.grid.horizontal.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.horizontal.amount; ++i) {
            const y = figure.get_height() * i / figure.grid.horizontal.amount
            context.moveTo(0, y)
            context.lineTo(this.state.figures.main.get_width(), y)
        }
        context.stroke()
        context.closePath()
        // Drawing vertical
        context.lineWidth = figure.grid.vertical.width * figure.canvas_density
        context.strokeStyle = figure.grid.vertical.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.vertical.amount; ++i) {
            const x = figure.get_width() * i / figure.grid.vertical.amount
            context.moveTo(x, 0)
            context.lineTo(x, figure.get_height())
        }
        context.stroke()
        context.closePath()
    }
    // Mouse events
    //// Main canvas
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandlerMain(event) {
        const [x, y] = [
            event.clientX - event.target.getBoundingClientRect().left,
            event.clientY - event.target.getBoundingClientRect().top
        ]
        if (this.drag.main.state) { // If mouse is held moves data range
            const x_offset = (x - this.drag.main.position.x) /
                (this.state.figures.hit.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving window to the left and data range to the right
                    data_range.end = data_range.end - x_offset >= 1 ? 1 : data_range.end - x_offset
                    data_range.start = data_range.end - (this.state.data_range.end - this.state.data_range.start)
                } else if (x_offset > 0) { // Moving window to the right and data range to the left
                    data_range.start = data_range.start - x_offset <= 0 ? 0 : data_range.start - x_offset
                    data_range.end = data_range.start + (this.state.data_range.end - this.state.data_range.start)
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start && data_range.end !== this.state.data_range.end) {
                    this.setState({data_range: data_range}, () => {
                        this.plot() // Redrawing plot with new data range
                    })
                }
            }
        } // Select data with maximum length
        const max_data_length = Math.max.apply(
            null, this.props.data.map(
                log => log.data.length
            )
        )
        const max_data = this.props.data.filter(
            log => log.data.length === max_data_length
        )[0].data.slice(
            Math.floor(max_data_length * this.state.data_range.start),
            Math.ceil(max_data_length * this.state.data_range.end)
        )
        const context = this.state.figures.hit.context
        context.clearRect(
            0, 0,
            this.state.figures.hit.get_width(),
            this.state.figures.hit.get_height()
        )
        context.save()
        context.beginPath()
        context.strokeStyle = '#696969'
        context.setLineDash([5, 5])
        // Drawing horizontal line
        context.moveTo(0, y)
        context.lineTo(this.state.figures.hit.get_width(), y)
        // Drawing vertical line
        //// Segment hit check
        const segment_width = this.state.figures.hit.get_width() / max_data.length
        const i = Math.floor(x / segment_width)
        context.moveTo(i * this.state.figures.main.scale.width, 0)
        context.lineTo(i * this.state.figures.main.scale.width, this.state.figures.hit.get_height())
        context.stroke()
        context.closePath()
        context.restore()
        // Assigning cursor tooltips
        const date = max_data[i].date
        let tooltips = []
        this.props.data.map(log => {
            const data = log.data.slice(
                Math.floor(log.data.length * this.state.data_range.start),
                Math.ceil(log.data.length * this.state.data_range.end)
            )
            if (i in data) {
                // Data tooltips
                const {date, value, balance, stocks} = data[i]
                // Drawing data point
                context.beginPath()
                context.arc(
                    i * this.state.figures.main.scale.width,
                    this.state.figures.main.axes.y - value * this.state.figures.main.scale.height,
                    0.005 * this.state.figures.hit.get_width(),
                    0,
                    2 * Math.PI
                )
                context.stroke()
                context.closePath()
                tooltips.push({
                    strategy: log.strategy,
                    value: {
                        currency: Math.round((value + Number.EPSILON) * 100) / 100,
                        percent: Math.round((value / log.data[0].value * 100 + Number.EPSILON) * 100) / 100
                    },
                    balance: {
                        currency: Math.round((balance + Number.EPSILON) * 100) / 100,
                        percent: Math.round((balance / log.data[0].balance * 100 + Number.EPSILON) * 100) / 100
                    },
                    stocks: stocks,
                })
            }
        })
        this.setState({
            tooltips: {
                tooltips: tooltips,
                date: date
            }
        })
    }
    // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
    mouseOutHandlerMain() {
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        this.setState({tooltips: null})
    }
    // Date range drag change
    mouseDownHandlerMain(event) {
        this.drag.main = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    // Mouse hold off
    mouseUpHandlerMain() {
        this.drag.main.state = false
    }
    //// Dates canvas
    mouseMoveHandlerDates(event) {
        if (this.drag.dates.state) { // If mouse is held moves data range
            const x_offset = (this.drag.dates.position.x - (event.clientX - event.target.getBoundingClientRect().left)) /
                (this.state.figures.dates.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                const max_data_length = Math.max.apply(
                    null, this.props.data.map(
                        log => log.data.length
                    )
                )
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * max_data_length > 10 ** 6 ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the right
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * max_data_length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    this.setState({data_range: data_range}, () => {
                        this.plot() // Redrawing plot with new data range
                    })
                }
            }
        }
    }
    mouseDownHandlerDates(event) {
        this.drag.dates = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    mouseUpHandlerDates() {
        this.drag.dates.state = false
    }
    // After-render plot building
    componentDidMount() {
        if (this.is_enough_data) {
            let state = this.state
            Object.keys(state.figures).map(key => {  // Setting up figures
                state.figures[key].context = state.figures[key].canvas.current.getContext('2d')
                state.figures[key].set_window()
            })
            // Setting basic observed data range
            const data_amount = Math.min.apply(
                null,
                this.props.data.map(log => Object.keys(log.data).length)
            )
            const default_data_amount = 10 ** 6
            state.data_range = {
                start: 1 - (data_amount <= default_data_amount ? data_amount : default_data_amount) / data_amount,
                end: 1
            }
            // Applying changes and calling drawing method
            this.setState(state, this.plot)
        }
    }
    render() {
        if (this.is_enough_data) {
            const tooltips = this.state.tooltips ?
                <div className={'plot_date_value_tooltips'}>
                    <span>Date: {this.state.tooltips.date}</span>
                    {this.state.tooltips.tooltips.map(tooltip =>
                        <ul key={tooltip.strategy} className={'plot_date_value_tooltip'}>
                            <li>Strategy: {tooltip.strategy}</li>
                            <li>Cost: {tooltip.value.percent}% ({tooltip.value.currency})</li>
                            <li>Balance: {tooltip.balance.percent}% ({tooltip.balance.currency})</li>
                            <li>Stocks:<table><tbody>
                                {Object.entries(tooltip.stocks).map(([name, amount]) =>
                                    <tr key={name}>
                                        <td>{name}</td>
                                        <td>{amount > 0 ? 'long ' + amount : amount < 0 ? 'short ' + -amount : amount}</td>
                                    </tr>
                                )}
                            </tbody></table>
                            </li>
                        </ul>
                    )}
                </div> : null
            return (
                <>
                    {tooltips}
                    <div className={'plot_date_value_grid'}>
                        <canvas
                            ref={this.state.figures.main.canvas}
                            className={'canvas_main'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.hit.canvas}
                            className={'canvas_hit'}
                            onMouseMove={this.mouseMoveHandlerMain}
                            onMouseOut={this.mouseOutHandlerMain}
                            onMouseDown={this.mouseDownHandlerMain}
                            onMouseUp={this.mouseUpHandlerMain}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.dates.canvas}
                            className={'canvas_dates'}
                            onMouseMove={this.mouseMoveHandlerDates}
                            onMouseDown={this.mouseDownHandlerDates}
                            onMouseUp={this.mouseUpHandlerDates}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.value.canvas}
                            className={'canvas_value'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                    </div>
                </>
            )
        } else {
            return (
                <div className={'plot_date_value_error_message'}>
                    Not enough data to observe. At least 5 data points required.
                </div>
            )
        }
    }
}
