import React from 'react'
import {colorT} from "../../../../types/general";
import {Drawing} from "./drawings";
import {PlotFinancialState} from "../PlotFinancial";

export class Figure {  // Figure class containing main plot component data
    public readonly name: string
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
    public position: {
        row: {
            start: number,
            end: number
        }
    }
    public drawings: Drawing[]
    public chart: {
        canvas: React.RefObject<HTMLCanvasElement>,
        context: CanvasRenderingContext2D | null | undefined,
        density: number,
    }
    public value_scale: {
        canvas: React.RefObject<HTMLCanvasElement>,
        context: CanvasRenderingContext2D | null | undefined,
        tooltip: {
            canvas: React.RefObject<HTMLCanvasElement>,
            context: CanvasRenderingContext2D | null | undefined,
        }
    }
    public tooltips: React.ReactElement[] | null
    // Meta data
    public min_value: number
    public max_value: number
    public data_amount: number
    // Chain redraw method
    public constructor(
        name: string,
        window_size_width: number, window_size_height: number,
        position_row_start: number, position_row_end: number,
        padding_left: number=0, padding_top: number=0, padding_right: number=0, padding_bottom: number=0,
        grid_vertical_amount: number=0, grid_vertical_color: colorT='#d9d9d9', grid_vertical_width: number=1,
        grid_horizontal_amount: number=0, grid_horizontal_color: colorT='#d9d9d9', grid_horizontal_width: number=1,
        density: number=1
    ) {
        this.name = name
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
        this.position = {
            row: {
                start: position_row_start,
                end: position_row_end
            }
        }
        this.drawings = []
        this.chart = {
            canvas: React.createRef(),
            context: null,
            density: density,
        }
        this.value_scale = {
            canvas: React.createRef(),
            context: null,
            tooltip: {
                canvas: React.createRef(),
                context: null,
            }
        }
        this.tooltips = null
        // Meta data
        this.min_value = 0
        this.max_value = 0
        this.data_amount =0
    }
    public get width(): number {  // Canvas actual width
        return this.window_size.width * this.chart.density
    }
    public get padded_width(): number {
        return this.width * (1 - this.padding.left - this.padding.right)
    }
    public get height(): number {  // Canvas actual height
        return this.window_size.height * this.chart.density
    }
    public get padded_height(): number {
        return this.height * (1 - this.padding.top - this.padding.bottom)
    }
    public set_window(): void {
        if (this.chart.canvas.current) {  // Chart
            this.chart.context = this.chart.canvas.current.getContext('2d')
            this.chart.canvas.current.style.width = `${this.window_size.width}px`
            this.chart.canvas.current.style.height = `${this.window_size.height}px`
            this.chart.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.chart.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.chart.canvas.current.style.gridColumnStart = '2'
            this.chart.canvas.current.style.gridColumnEnd = '3'
            this.chart.canvas.current.style.zIndex = '0'
            this.chart.canvas.current.width = this.width
            this.chart.canvas.current.height = this.height
        }
        if (this.value_scale.canvas.current) {  // Value scale
            this.value_scale.context = this.value_scale.canvas.current.getContext('2d')
            this.value_scale.canvas.current.style.width = '48px'
            this.value_scale.canvas.current.style.height = `${this.window_size.height}px`
            this.value_scale.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.value_scale.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.value_scale.canvas.current.style.gridColumnStart = '1'
            this.value_scale.canvas.current.style.gridColumnEnd = '2'
            this.value_scale.canvas.current.style.zIndex = '0'
            this.value_scale.canvas.current.width = 48
            this.value_scale.canvas.current.height = this.height
        }
        if (this.value_scale.tooltip.canvas.current) {  // Value scale tooltip
            this.value_scale.tooltip.context = this.value_scale.tooltip.canvas.current.getContext('2d')
            this.value_scale.tooltip.canvas.current.style.width = '48px'
            this.value_scale.tooltip.canvas.current.style.height = `${this.window_size.height}px`
            this.value_scale.tooltip.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.value_scale.tooltip.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.value_scale.tooltip.canvas.current.style.gridColumnStart = '1'
            this.value_scale.tooltip.canvas.current.style.gridColumnEnd = '2'
            this.value_scale.tooltip.canvas.current.style.zIndex = '1'
            this.value_scale.tooltip.canvas.current.width = 48
            this.value_scale.tooltip.canvas.current.height = this.height
        }
    }
    public show_grid(): void {  // Show translucent grid
        if (this.chart.context) {
            this.chart.context.save()  // Saving context
            // Drawing horizontal
            this.chart.context.beginPath()
            for (let i = 1; i <= this.grid.horizontal.amount; ++i) {
                const y = i * this.height / (this.grid.horizontal.amount + 1)
                this.chart.context.moveTo(0, y)
                this.chart.context.lineTo(this.width, y)
            }
            this.chart.context.lineWidth = this.grid.horizontal.width * this.chart.density
            this.chart.context.strokeStyle = this.grid.horizontal.color
            this.chart.context.stroke()
            this.chart.context.closePath()
            this.chart.context.restore()
            // Drawing vertical
            this.chart.context.save()
            this.chart.context.beginPath()
            for (let i = 1; i <= this.grid.vertical.amount; ++i) {
                const x = this.width * i / (this.grid.vertical.amount + 1)
                this.chart.context.moveTo(x, 0)
                this.chart.context.lineTo(x, this.height)
            }
            this.chart.context.lineWidth = this.grid.vertical.width * this.chart.density
            this.chart.context.strokeStyle = this.grid.vertical.color
            this.chart.context.stroke()
            this.chart.context.closePath()
            this.chart.context.restore()  // Restoring context
        }
    }
    public get spread(): number {
        return this.max_value - this.min_value
    }
    public async recalculate_metadata(
        data_range: PlotFinancialState['data_range']
    ): Promise<void> {  // Precalculating frequently used data
        this.drawings.forEach(
            async drawing =>
                await drawing.recalculate_metadata(data_range)
        )
        this.min_value = Math.min.apply(
            null,
            this.drawings.map(drawing => drawing.min_value)
        )
        this.max_value = Math.max.apply(
            null,
            this.drawings.map(drawing => drawing.max_value)
        )
        this.data_amount = Math.max.apply(
            null,
            this.drawings.map(drawing => drawing.data_amount)
        )
        // Rescaling
        this.scale.height = this.padded_height / (this.max_value - this.min_value)
        this.scale.width = this.padded_width / this.data_amount
        // Moving coordinates system
        this.axes.y = this.max_value * this.scale.height +
            this.padding.top * this.height
        this.axes.x = this.padding.left * this.width
    }
    public async plot(): Promise<void> {
        if (this.chart.context) {  // Drawing charts
            this.chart.context.clearRect(
                0, 0,
                this.width,
                this.height
            )
            this.show_grid()
            // Coordinates transform
            this.chart.context.save()
            this.chart.context.translate(
                this.axes.x, this.axes.y
            )
            this.chart.context.scale(
                1, -this.scale.height
            )
            this.drawings.forEach(async drawing => await drawing.plot())
            this.chart.context.restore()
        }
        if (this.value_scale.context) {  // Drawing value scale
            this.value_scale.context.clearRect(
                0, 0,
                this.width, this.height
            )
            const value_per_pixel = this.spread / this.padded_height
            const step = this.height / (
                this.grid.horizontal.amount + 1
            ) * value_per_pixel
            this.value_scale.context.save()
            this.value_scale.context.font = '10px Arial'
            for (let i = 1; i <= this.grid.horizontal.amount; ++i) {
                this.value_scale.context.beginPath()
                const y = (
                    1 - i / (this.grid.horizontal.amount + 1)
                ) * this.height
                this.value_scale.context.moveTo(
                    48 * (1 - this.padding.right), y
                )
                this.value_scale.context.lineTo(
                    48 * (0.9 - this.padding.right), y
                )
                this.value_scale.context.stroke()
                this.value_scale.context.closePath()
                // Drawing value
                const value = i * step + this.min_value - this.padding.bottom * this.height * value_per_pixel
                let text: number | string = Math.round((value + Number.EPSILON) * 100) / 100
                if (value >= 10 ** 6) {
                    text = `${Math.round((value / 10 ** 6 + Number.EPSILON) * 100) / 100}M`
                } else if (value >= 10 ** 9) {
                    text = `${Math.round((value / 10 ** 9 + Number.EPSILON) * 100) / 100}B`
                }
                this.value_scale.context.fillText(
                    String(text), 48 * 0.05, y + 4
                )
            }
            this.value_scale.context.restore()
        }
    }
    public show_tooltips(y: number, i: number): any {
        let grid_step = this.height / this.grid.horizontal.amount
        if (this.value_scale.tooltip.context) {
            this.value_scale.tooltip.context.clearRect(
                0, 0,
                48, this.height
            )
            this.value_scale.tooltip.context.save()
            this.value_scale.tooltip.context.fillStyle = '#323232'
            this.value_scale.tooltip.context.fillRect(
                0, y - grid_step / 4,
                48, grid_step / 2
            )
            this.value_scale.tooltip.context.font = '10px Arial'
            this.value_scale.tooltip.context.fillStyle = '#ffffff'
            // Value tooltip
            let value: number | string = Math.round(
                (  // dv/dh * (y - hmin) + vmin
                    this.spread / this.padded_height * (
                        this.height * (1 - this.padding.bottom) - y
                    ) + this.min_value + Number.EPSILON
                ) * 100
            ) / 100
            if (value >= 10 ** 6) {
                value = `${Math.round((value / 10 ** 6 + Number.EPSILON) * 100) / 100}M`
            } else if (value >= 10 ** 9) {
                value = `${Math.round((value / 10 ** 9 + Number.EPSILON) * 100) / 100}B`
            }
            this.value_scale.tooltip.context.fillText(
                String(value), 48 * 0.05, y + 3
            )
            this.value_scale.tooltip.context.restore()
        }
        // Data tooltips
        this.tooltips = this.drawings.map(
            drawing => drawing.show_tooltips(i)
        )
        return this.tooltips
    }
    hide_tooltips() {
        if (this.value_scale.tooltip.context)
            this.value_scale.tooltip.context.clearRect(
                0, 0,
                48, this.height
            )
    }
}

export class DatesScale extends Figure {
    public canvas: React.RefObject<HTMLCanvasElement>
    public context: CanvasRenderingContext2D | null | undefined
    public tooltip: {
        canvas: React.RefObject<HTMLCanvasElement>,
        context: CanvasRenderingContext2D | null | undefined
    }
    public drag: {
        state: boolean,
        position: {
            x: number,
            y: number
        }
    }
    public data: string[]
    public observed_data: string[]
    public constructor(
        window_size_width: number, window_size_height: number,
        position_row_start: number, position_row_end: number,
        data: string[]
    ) {
        super(
            'dates',
            window_size_width, window_size_height,
            position_row_start, position_row_end
        )
        this.canvas = React.createRef()
        this.context = null
        this.tooltip = {
            canvas: React.createRef(),
            context: null
        }
        this.drag = {
            state: false,
            position: {
                x: 0,
                y: 0
            }
        }
        this.data = data
        this.observed_data = []
    }
    public set_window(): void {
        if (this.canvas.current) {  // Dates scale
            this.context = this.canvas.current.getContext('2d')
            this.canvas.current.style.width = `${this.window_size.width}px`
            this.canvas.current.style.height = `${this.window_size.height}px`
            this.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.canvas.current.style.gridColumnStart = '2'
            this.canvas.current.style.gridColumnEnd = '3'
            this.canvas.current.style.zIndex = '0'
            this.canvas.current.width = this.width
            this.canvas.current.height = this.height
        }
        if (this.tooltip.canvas.current) {  // Tooltip
            this.tooltip.context = this.tooltip.canvas.current.getContext('2d')
            this.tooltip.canvas.current.style.width = `${this.window_size.width}px`
            this.tooltip.canvas.current.style.height = `${this.window_size.height}px`
            this.tooltip.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.tooltip.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.tooltip.canvas.current.style.gridColumnStart = '2'
            this.tooltip.canvas.current.style.gridColumnEnd = '3'
            this.tooltip.canvas.current.style.zIndex = '1'
            this.tooltip.canvas.current.width = this.width
            this.tooltip.canvas.current.height = this.height
        }
    }
    public async recalculate_metadata(
        data_range: PlotFinancialState['data_range']
    ): Promise<void> {  // Precalculating frequently used data
        if (data_range) {
            const [start, end] = [
                Math.floor(this.data.length * data_range.start),
                Math.ceil(this.data.length * data_range.end)
            ]
            this.observed_data = this.data.slice(start, end)
            this.data_amount = this.observed_data.length
            // Rescaling
            this.scale.width = this.padded_width / this.observed_data.length
        }
    }
    public async plot(): Promise<void> {
        if (this.context) {
            this.context.clearRect(
                0, 0,
                this.width,
                this.height
            )
            let step = Math.ceil(this.observed_data.length * 0.1)
            this.context.save()
            this.context.font = '10px Arial'
            for (let i = step; i <= this.observed_data.length - step * 0.5; i += step) {
                this.context.beginPath()
                this.context.moveTo(
                    (2 * i + 1.1) * this.scale.width / 2 - 1, 0
                )
                this.context.lineTo(
                    (2 * i + 1.1) * this.scale.width / 2 - 1,
                    this.height * 0.1
                )
                this.context.stroke()
                this.context.closePath()
                this.context.fillText(
                    this.observed_data[i],
                    (2 * i + 1.1) * this.scale.width / 2 - 25,
                    this.height * 0.3
                )
            }
            this.context.restore()
        }
    }
    public async show_tooltip(i: number, segment_width: number): Promise<void> {
        if (this.tooltip.context) {
            this.tooltip.context.clearRect(
                0, 0,
                this.width, this.height
            )
            this.tooltip.context.save()
            this.tooltip.context.fillStyle = '#323232'
            this.tooltip.context.fillRect(
                (2 * i + 1.1) * segment_width / 2 - 30, 0,
                60, this.height * 0.4
            )
            this.tooltip.context.font = '10px Arial'
            this.tooltip.context.fillStyle = '#ffffff'
            this.tooltip.context.fillText(
                this.observed_data[i],
                (2 * i + 1.1) * segment_width / 2 - 25,
                this.height * (
                    this.padding.top + 0.3
                )
            )
            this.tooltip.context.restore()
        }
    }
    public hide_tooltip(): void {
        if (this.tooltip.context)
            this.tooltip.context.clearRect(
                0, 0,
                this.width, this.height
            )
    }
}

export class Hit extends Figure {
    public canvas: React.RefObject<HTMLCanvasElement>
    public context: CanvasRenderingContext2D | null | undefined
    public drag: {
        state: boolean,
        position: {
            x: number,
            y: number
        }
    }
    public constructor(
        window_size_width: number, window_size_height: number,
        position_row_start: number, position_row_end: number
    ) {
        super(
            'hit',
            window_size_width, window_size_height,
            position_row_start, position_row_end
        )
        this.canvas = React.createRef()
        this.context = null
        this.drag = {
            state: false,
            position: {
                x: 0,
                y: 0
            }
        }
    }
    public set_window(): void {
        if (this.canvas.current) {
            this.context = this.canvas.current.getContext('2d')
            this.canvas.current.style.width = `${this.window_size.width}px`
            this.canvas.current.style.height = `${this.window_size.height}px`
            this.canvas.current.style.gridRowStart = String(this.position.row.start)
            this.canvas.current.style.gridRowEnd = String(this.position.row.end)
            this.canvas.current.style.gridColumnStart = '2'
            this.canvas.current.style.gridColumnEnd = '3'
            this.canvas.current.style.zIndex = '1'
            this.canvas.current.width = this.width
            this.canvas.current.height = this.height
        }
    }
    public async show_tooltip(
        x:number,
        y: number,
        i: number,
        segment_width: number
    ): Promise<void> {
        if (this.context) {
            this.context.clearRect(
                0, 0,
                this.width, this.height
            )
            this.context.save()
            this.context.beginPath()
            this.context.strokeStyle = '#696969'
            this.context.setLineDash([5, 5])
            // Drawing horizontal line
            this.context.moveTo(0, y)
            this.context.lineTo(this.width, y)
            // Drawing vertical line
            this.context.moveTo(
                (2 * i + 1.1) * segment_width / 2, 0
            )
            this.context.lineTo(
                (2 * i + 1.1) * segment_width / 2, this.height
            )
            this.context.stroke()
            this.context.closePath()
            this.context.restore()
        }
    }
    public hide_tooltip(): void {
        if (this.context)
            this.context.clearRect(
                0, 0,
                this.width, this.height
            )
    }
}
