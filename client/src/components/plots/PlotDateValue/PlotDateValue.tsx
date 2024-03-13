import React from 'react'
import './PlotDateValue.css'
import {colorT} from "../../../types/general"
import {PlotFinancialState} from "../PlotFinancial/PlotFinancial"


// Figure class containing main plot component data
class Figure {
    public window_size: {
        width: number,
        height: number
    }
    public scale: {
        width: number,
        height: number
    }
    public padding: {
        left: number,
        top: number,
        right: number,
        bottom: number
    }
    public axes: {
        x: number,
        y: number
    }
    public grid: {
        vertical: {
            amount: number,
            color: colorT,
            width: number,
        },
        horizontal: {
            amount: number,
            color: colorT,
            width: number,
        }
    }
    public canvas: React.RefObject<HTMLCanvasElement>
    public context: CanvasRenderingContext2D | null
    public density: number
    constructor(
        window_size_width: number,
        window_size_height: number,
        padding_left=0,
        padding_top=0,
        padding_right=0,
        padding_bottom=0,
        grid_vertical_amount=0,
        grid_vertical_color: colorT='#000000',
        grid_vertical_width=1,
        grid_horizontal_amount=0,
        grid_horizontal_color: colorT='#000000',
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
        this.density = canvas_density
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width * this.density
    }
    get_padded_width() {
        return this.get_width() * (1 - this.padding.left - this.padding.right)
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height * this.density
    }
    get_padded_height() {
        return this.get_height() * (1 - this.padding.top - this.padding.bottom)
    }
    set_window() {
        if (this.canvas.current) {
            this.context = this.canvas.current.getContext('2d')
            this.canvas.current.style.width = `${this.window_size.width}px`
            this.canvas.current.style.height = `${this.window_size.height}px`
            this.canvas.current.width = this.get_width()
            this.canvas.current.height = this.get_height()
        }
    }
    // Show translucent grid
    show_grid() {
        if (this.context) {
            this.context.save()  // Saving context
            // Drawing horizontal
            this.context.beginPath()
            for (let i = 1; i <= this.grid.horizontal.amount; ++i) {
                const y = this.get_height() * i / this.grid.horizontal.amount
                this.context.moveTo(0, y)
                this.context.lineTo(this.get_width(), y)
            }
            this.context.lineWidth = this.grid.horizontal.width * this.density
            this.context.strokeStyle = this.grid.horizontal.color
            this.context.stroke()
            this.context.closePath()
            // Drawing vertical
            this.context.beginPath()
            for (let i = 1; i <= this.grid.vertical.amount; ++i) {
                const x = this.get_width() * i / this.grid.vertical.amount
                this.context.moveTo(x, 0)
                this.context.lineTo(x, this.get_height())
            }
            this.context.lineWidth = this.grid.vertical.width * this.density
            this.context.strokeStyle = this.grid.vertical.color
            this.context.stroke()
            this.context.closePath()
            this.context.restore()  // Restoring context
        }
    }
}

interface PlotDateValueProps {
    data: {
        data: {
            date: string,
            value: number,
            balance: number,
            stocks: {
                [key: string]: number
            }
        }[],
        strategy: string
    }[]
}

interface PlotDateValueState {
    figures: {
        [key: string]: Figure
    }
    data_range: {
        start: number,
        end: number
    } | null
    tooltips: {
        strategy: string,
        value: {
            currency: number,
            percent: number
        },
        balance: {
            currency: number,
            percent: number
        },
        stocks: {
            [key: string]: number
        },
    }[] | null
    meta_data: {
        data: {
            date: string,
            value: number,
            balance: number,
            stocks: {
                [key: string]: number
            }
        }[][],
        value: {
            min: number,
            max: number,
            spread: number
        }
    }
}

// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotDateValue extends React.Component<
    PlotDateValueProps,
    PlotDateValueState
> {
    public drag: {
        main: {
            state: boolean,
            position: {
                x: number,
                y: number
            }
        },
        dates: {
            state: boolean,
            position: {
                x: number,
                y: number
            }
        }
    }
    public max_data: number
    public font: string
    public colors: colorT[]
    constructor(props: any) {
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
                dates: new Figure(850, 48),
                dates_tooltip: new Figure(850, 48),
                value: new Figure(48, 480),
                value_tooltip: new Figure(48, 480)
            },
            data_range: null,
            tooltips: null,
            meta_data: {
                data: [],
                value: {
                    min: 0,
                    max: 0,
                    spread: 0
                }
            }
        }
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
        this.max_data = 1000  // Max data points on chart simultaneously
        this.font = '10px Arial'
        this.colors = [  // Lines colors
            '#d14d00',
            '#000fca',
            '#5ec200',
            '#bb0000',
            '#8900ad',
            '#bb8b00',
            '#00a076',
        ]
        // Methods binding
        this.recalculate_metadata = this.recalculate_metadata.bind(this)
        this.plot = this.plot.bind(this)
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

    recalculate_metadata(data_range: PlotFinancialState['data_range']) {  // Precalculating frequently used data
        const data_amount = this.props.data[0].data.length
        if (data_range) {
            const [start, end] = [
                Math.floor(data_amount * data_range.start),
                Math.ceil(data_amount * data_range.end)
            ]
            const data = this.props.data.map(log => log.data.slice(start, end))
            const [max_value, min_value] = [
                Math.max.apply(
                    null, data.map(
                        log => Math.max.apply(null, Array.from(
                            log, obj => obj.value
                        ))
                    )
                ),
                Math.min.apply(
                    null, data.map(
                        log => Math.min.apply(null, Array.from(
                            log, obj => obj.value
                        ))
                    )
                )
            ]
            let state = this.state
            // Rescaling
            state.figures.main.scale.height =
                state.figures.main.get_padded_height() / (max_value - min_value)
            state.figures.main.scale.width =
                state.figures.main.get_padded_width() / data[0].length
            // Moving coordinates system
            state.figures.main.axes.y =
                max_value * state.figures.main.scale.height +
                state.figures.main.padding.top * state.figures.main.get_height()
            state.figures.main.axes.x =
                state.figures.main.padding.left * state.figures.main.get_width()
            this.setState({
                ...state,
                data_range,
                meta_data: {
                    data: data,
                    value: {
                        min: min_value,
                        max: max_value,
                        spread: max_value - min_value
                    }
                }
            }, this.plot)
        }
    }

    // Date-value type plot (<date:String>, <value:Number>)
    async plot() {
        Object.values(this.state.figures).forEach(
            figure => {  // Clearing window
                figure.context?.clearRect(
                    0, 0,
                    figure.get_width(),
                    figure.get_height()
                )  // Drawing grid
                figure.show_grid()
            }
        )
        // Drawing curves
        const data_amount = this.state.meta_data.data[0].length
        this.props.data.map((log, ind) => {
            if (this.state.figures.main.context) {
                // Getting observed data range
                const values = Array.from(
                    this.state.meta_data.data[ind],
                    obj => obj.value
                )
                // Changing context
                this.state.figures.main.context.save()
                this.state.figures.main.context.translate(
                    this.state.figures.main.axes.x,
                    this.state.figures.main.axes.y
                )
                this.state.figures.main.context.scale(
                    1,
                    -this.state.figures.main.scale.height
                )
                // Drawing plot
                this.state.figures.main.context.beginPath()
                this.state.figures.main.context.moveTo(0, values[0])
                for (let i = 1; i < data_amount; ++i) {
                    this.state.figures.main.context.lineTo(
                        i * this.state.figures.main.scale.width,
                        values[i]
                    )
                }
                this.state.figures.main.context.restore()
                this.state.figures.main.context.lineWidth = 2
                this.state.figures.main.context.strokeStyle = this.colors[ind]
                this.state.figures.main.context.stroke()
                this.state.figures.main.context.closePath()
                // Drawing legend
                this.state.figures.main.context.font = '12px Arial'
                this.state.figures.main.context.fillStyle = this.colors[ind]
                this.state.figures.main.context.fillText(
                    log.strategy, 15,
                    this.state.figures.main.get_height() /
                    this.props.data.length / 10 * (ind + 1)
                )
            }
        })
        // Drawing dates
        let step = Math.ceil(data_amount * 0.1)
        if (this.state.figures.dates.context) {
            this.state.figures.dates.context.font = this.font
            for (let i = step; i <= data_amount - step * 0.5; i += step) {
                this.state.figures.dates.context.beginPath()
                this.state.figures.dates.context.moveTo(
                    i * this.state.figures.main.scale.width - 1,
                    this.state.figures.dates.get_height() * this.state.figures.dates.padding.top
                )
                this.state.figures.dates.context.lineTo(
                    i * this.state.figures.main.scale.width - 1,
                    this.state.figures.dates.get_height() * (this.state.figures.dates.padding.top + 0.1)
                )
                this.state.figures.dates.context.stroke()
                this.state.figures.dates.context.closePath()
                this.state.figures.dates.context.fillText(
                    this.state.meta_data.data[0][i].date,
                    i * this.state.figures.main.scale.width - 25,
                    this.state.figures.dates.get_height() * (this.state.figures.dates.padding.top + 0.3)
                )
            }
        }
        // Drawing value scale
        step = this.state.meta_data.value.spread / (this.state.figures.main.grid.horizontal.amount - 2)
        if (this.state.figures.value.context) {
            this.state.figures.value.context.font = this.font
            for (let i = this.state.meta_data.value.min; i < this.state.meta_data.value.max + step * 0.5; i += step) {
                this.state.figures.value.context.beginPath()
                const y = this.state.figures.value.get_height() * (
                    1 - (i - this.state.meta_data.value.min) / step /
                    this.state.figures.main.grid.vertical.amount *
                    this.state.figures.value.scale.height - this.state.figures.main.padding.bottom
                ) - 1
                this.state.figures.value.context.moveTo(
                    this.state.figures.value.get_width() * (
                        1 - this.state.figures.value.padding.right
                    ), y
                )
                this.state.figures.value.context.lineTo(
                    this.state.figures.value.get_width() * (
                        0.9 - this.state.figures.value.padding.right
                    ), y
                )
                this.state.figures.value.context.stroke()
                this.state.figures.value.context.closePath()
                this.state.figures.value.context.fillText(
                    `${Math.round((
                        i / this.state.meta_data.data[0][0].value *
                        100 + Number.EPSILON
                    ) * 100) / 100}%`,
                    this.state.figures.value.get_width() * 0.05,
                    y + 4
                )
            }
        }
    }
    // Mouse events
    //// Main canvas
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandlerMain(event: React.MouseEvent) {
        const [x, y] = [  // Getting current in-object coordinates
            event.clientX - (
                event.target as HTMLCanvasElement
            ).getBoundingClientRect().left,
            event.clientY - (
                event.target as HTMLCanvasElement
            ).getBoundingClientRect().top
        ]
        if (x >= 0 && y >= 0) {
            if (this.drag.main.state) { // If mouse is held moves data range
                const x_offset = (x - this.drag.main.position.x) /
                    (this.state.figures.hit.get_width() * 200)
                if (x_offset && this.state.data_range) {
                    // Copying current data range to new object
                    let data_range = {...this.state.data_range}
                    if (x_offset < 0) { // Moving window to the left and data range to the right
                        data_range.end = data_range.end - x_offset >= 1 ? 1 : data_range.end - x_offset
                        data_range.start = data_range.end - (this.state.data_range.end - this.state.data_range.start)
                    } else if (x_offset > 0) { // Moving window to the right and data range to the left
                        data_range.start = data_range.start - x_offset <= 0 ? 0 : data_range.start - x_offset
                        data_range.end = data_range.start + (this.state.data_range.end - this.state.data_range.start)
                    } // Check if changes are visible (not visible on bounds)
                    if (data_range.start !== this.state.data_range.start && data_range.end !== this.state.data_range.end) {
                        this.recalculate_metadata(data_range)
                    }
                }
            } // Select data with maximum length
            if (this.state.figures.hit.context) {
                this.state.figures.hit.context.clearRect(
                    0, 0,
                    this.state.figures.hit.get_width(),
                    this.state.figures.hit.get_height()
                )
                this.state.figures.hit.context.save()
                this.state.figures.hit.context.beginPath()
                this.state.figures.hit.context.strokeStyle = '#696969'
                this.state.figures.hit.context.setLineDash([5, 5])
                // Drawing horizontal line
                this.state.figures.hit.context.moveTo(0, y)
                this.state.figures.hit.context.lineTo(this.state.figures.hit.get_width(), y)
            }
            // Drawing value tooltip
            let grid_step = this.state.figures.main.get_height() /
                this.state.figures.main.grid.horizontal.amount
            if (this.state.figures.value_tooltip.context) {
                this.state.figures.value_tooltip.context.clearRect(
                    0, 0,
                    this.state.figures.value_tooltip.get_width(),
                    this.state.figures.value_tooltip.get_height()
                )
                this.state.figures.value_tooltip.context.save()
                this.state.figures.value_tooltip.context.fillStyle = '#323232'
                this.state.figures.value_tooltip.context.fillRect(
                    0,
                    y - grid_step / 4,
                    this.state.figures.value_tooltip.get_width(),
                    grid_step / 2
                )
                this.state.figures.value_tooltip.context.font = this.font
                this.state.figures.value_tooltip.context.fillStyle = '#ffffff'
                this.state.figures.value_tooltip.context.fillText(
                    `${Math.round(
                        (  // dv/dh * (y - hmin) + vmin
                            (
                                this.state.meta_data.value.spread /
                                this.state.figures.main.get_padded_height() * (
                                    this.state.figures.main.get_height() - y -
                                    this.state.figures.main.get_height() *
                                    this.state.figures.main.padding.bottom
                                ) + this.state.meta_data.value.min
                            ) / this.state.meta_data.data[0][0].value * 100 + Number.EPSILON
                        ) * 100
                    ) / 100}%`,
                    this.state.figures.value_tooltip.get_width() * 0.05,
                    y + 3
                )
                this.state.figures.value_tooltip.context.restore()
            }
            // Drawing vertical line
            //// Segment hit check
            const segment_width =
                this.state.figures.hit.get_width() /
                this.state.meta_data.data[0].length
            const i = Math.floor(x / segment_width)
            if (this.state.figures.hit.context) {
                this.state.figures.hit.context.moveTo(
                    i * this.state.figures.main.scale.width, 0
                )
                this.state.figures.hit.context.lineTo(
                    i * this.state.figures.main.scale.width,
                    this.state.figures.hit.get_height()
                )
                this.state.figures.hit.context.stroke()
                this.state.figures.hit.context.closePath()
                this.state.figures.hit.context.restore()
            }
            // Drawing date tooltip
            if (this.state.figures.dates_tooltip.context) {
                this.state.figures.dates_tooltip.context.clearRect(
                    0, 0,
                    this.state.figures.dates_tooltip.get_width(),
                    this.state.figures.dates_tooltip.get_height()
                )
                this.state.figures.dates_tooltip.context.save()
                this.state.figures.dates_tooltip.context.fillStyle = '#323232'
                this.state.figures.dates_tooltip.context.fillRect(
                    i * this.state.figures.main.scale.width - 30,
                    0,
                    60,
                    this.state.figures.dates_tooltip.get_height() * 0.4
                )
                this.state.figures.dates_tooltip.context.font = this.font
                this.state.figures.dates_tooltip.context.fillStyle = '#ffffff'
                this.state.figures.dates_tooltip.context.fillText(
                    this.state.meta_data.data[0][i].date,
                    i * this.state.figures.main.scale.width - 25,
                    this.state.figures.dates_tooltip.get_height() * (
                        this.state.figures.dates_tooltip.padding.top + 0.3
                    )
                )
                this.state.figures.dates_tooltip.context.restore()
            }
            // Assigning cursor tooltips
            let tooltips: PlotDateValueState['tooltips'] = []
            this.props.data.map((log, ind) => {
                const data = this.state.meta_data.data[ind]
                // Data tooltips
                const {date, value, balance, stocks} = data[i]
                // Drawing data point
                if (this.state.figures.hit.context) {
                    this.state.figures.hit.context.beginPath()
                    this.state.figures.hit.context.arc(
                        i * this.state.figures.main.scale.width,
                        this.state.figures.main.axes.y - value *
                        this.state.figures.main.scale.height,
                        0.005 * this.state.figures.hit.get_width(),
                        0,
                        2 * Math.PI
                    )
                    this.state.figures.hit.context.stroke()
                    this.state.figures.hit.context.closePath()
                }
                tooltips?.push({
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
            })
            this.setState({tooltips: tooltips})
        }
    }
    // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
    mouseOutHandlerMain() {
        this.state.figures.hit.context?.clearRect(
            0, 0,
            this.state.figures.hit.get_width(),
            this.state.figures.hit.get_height()
        )
        this.state.figures.value_tooltip.context?.clearRect(
            0, 0,
            this.state.figures.value_tooltip.get_width(),
            this.state.figures.value_tooltip.get_height()
        )
        this.state.figures.dates_tooltip.context?.clearRect(
            0, 0,
            this.state.figures.dates_tooltip.get_width(),
            this.state.figures.dates_tooltip.get_height()
        )
        this.setState({tooltips: null})
    }
    // Date range drag change
    mouseDownHandlerMain(event: React.MouseEvent) {
        this.drag.main = {
            state: true,
            position: {
                x: event.clientX - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().left,
                y: event.clientY - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().top,
            }
        }
    }
    // Mouse hold off
    mouseUpHandlerMain() {
        this.drag.main.state = false
    }
    //// Dates canvas
    async mouseMoveHandlerDates(event: React.MouseEvent) {
        if (this.drag.dates.state) { // If mouse is held moves data range
            const x_offset = (this.drag.dates.position.x - (event.clientX - (
                event.target as HTMLCanvasElement
                ).getBoundingClientRect().left)) /
                (this.state.figures.dates.get_width() * 200)
            if (x_offset && this.state.data_range) {
                // Copying current data range to new object
                let data_range = {...this.state.data_range}
                const max_data_length = Math.max.apply(
                    null, this.props.data.map(
                        log => log.data.length
                    )
                )
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * max_data_length > this.max_data ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the right
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * max_data_length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    this.recalculate_metadata(data_range)
                }
            }
        }
    }
    mouseDownHandlerDates(event: React.MouseEvent) {
        this.drag.dates = {
            state: true,
            position: {
                x: event.clientX - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().left,
                y: event.clientY - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().top,
            }
        }
    }
    mouseUpHandlerDates() {
        this.drag.dates.state = false
    }
    // After-render plot building
    componentDidMount() {
        const data_amount = this.props.data[0].data.length
        if (data_amount >= 5) {
            Object.values(this.state.figures).forEach(figure => figure.set_window())
            this.recalculate_metadata(
                {  // Setting basic observed data range
                    start: 1 - (
                        data_amount <= this.max_data ?
                            data_amount :
                            this.max_data
                    ) / data_amount,
                    end: 1
                }
            )
        }
    }
    render() {
        if (this.props.data[0].data.length) {
            const tooltips = this.state.tooltips ?
                <div className={'plot_date_value_tooltips'}>
                    {this.state.tooltips.map(tooltip =>
                        <ul key={tooltip.strategy} className={'plot_date_value_tooltip'}>
                            <li>Strategy: {tooltip.strategy}</li>
                            <li>Value: {tooltip.value.percent}% ({tooltip.value.currency})</li>
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
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.dates_tooltip.canvas}
                            className={'canvas_dates_tooltip'}
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
                        <canvas
                            ref={this.state.figures.value_tooltip.canvas}
                            className={'canvas_value_tooltip'}
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
