import React from "react";
import ColorPalette from "../../ColorPalette/ColorPalette"
import {Figure} from "./figures";
import {PlotFinancialState} from "../PlotFinancial";
import {colorT} from "../../../../types/general";

export abstract class Drawing {
    public visible: boolean
    public tooltips: any
    public min_value: number
    public max_value: number
    public observed_data: any[]
    public constructor(
        public readonly name: string,
        public data: any[],
        public figure: Figure,
        public style: any
    ) {
        this.visible = true
        this.tooltips = null
        this.min_value = 0
        this.max_value = 0
        this.observed_data = []
    }
    public get spread() {
        return this.max_value - this.min_value
    }
    public get data_amount() {
        return this.observed_data.length
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
            this.min_value = Math.min.apply(null, this.observed_data)
            this.max_value = Math.max.apply(null, this.observed_data)
        }
    }
    public abstract plot(): Promise<void>
    public abstract show_style(): React.ReactElement
    public show_tooltips(i: number): React.ReactElement {
        this.tooltips = (
            <span key={this.name}>
                {this.name}: {
                    Math.round((
                        this.observed_data[i] + Number.EPSILON
                    ) * 100) / 100}
            </span>
        )
        return this.tooltips
    }
}

export class Line extends Drawing {
    public async plot(): Promise<void> {
        if (this.visible && this.figure.chart.context) {
            // Drawing
            this.figure.chart.context.beginPath()
            this.figure.chart.context.moveTo(
                1.1 * this.figure.scale.width / 2,
                this.observed_data[0]
            )
            for (let i = 1; i < this.observed_data.length; ++i) {
                this.figure.chart.context.lineTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    this.observed_data[i]
                )
            }
            // Stroking
            this.figure.chart.context.restore()
            this.figure.chart.context.lineWidth = this.style.width
            this.figure.chart.context.strokeStyle = this.style.color
            this.figure.chart.context.stroke()
            this.figure.chart.context.save()
            this.figure.chart.context.translate(
                this.figure.axes.x, this.figure.axes.y
            )
            this.figure.chart.context.scale(
                1, -this.figure.scale.height
            )
            this.figure.chart.context.closePath()
        }
    }
    public show_style(): React.ReactElement {
        return (
            <div key={this.name}>
                <label htmlFor={'visible'}>{this.name}</label>
                <input type={'checkbox'} name={'visible'}
                       onChange={(event) => {
                           this.visible = event.target.checked
                           this.figure.plot()
                       }}
                       defaultChecked={this.visible}
                />
                <ul>
                    <li>
                        Line color: <ColorPalette
                            default={this.style.color}
                            setColor={(color: colorT) => {
                                this.style.color = color
                                this.figure.plot()
                            }}
                        />
                    </li>
                    <li>
                        Line width: <input
                            type={'number'}
                            min={1} max={3} step={1}
                            defaultValue={this.style.width}
                            onChange={(event) => {
                                this.style.width = event.target.valueAsNumber
                                this.figure.plot()
                            }}
                        />
                    </li>
                </ul>
            </div>
        )
    }
}

export class Hist extends Drawing {
    public async plot(): Promise<void> {
        if (this.visible && this.figure.chart.context) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const value = this.observed_data[i]
                this.figure.chart.context.fillStyle = value > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                this.figure.chart.context.fillRect(
                    (i + 0.1) * this.figure.scale.width,
                    0,
                    this.figure.scale.width * 0.9,
                    value
                )
            }
            this.figure.chart.context.restore()
        }
    }
    public show_style(): React.ReactElement {
        return (
            <div key={this.name}>
                <label htmlFor={'visible'}>{this.name}</label>
                <input type={'checkbox'} name={'visible'}
                       onChange={(event) => {
                           this.visible = event.target.checked
                           this.figure.plot()
                       }}
                       defaultChecked={this.visible}
                />
                <ul>
                    <li>
                        Positive color: <ColorPalette
                            default={this.style.color.pos}
                            setColor={(color: colorT) => {
                                this.style.color.pos = color
                                this.figure.plot()
                            }}
                        />
                    </li>
                    <li>
                        Negative color: <ColorPalette
                            default={this.style.color.neg}
                            setColor={(color: colorT) => {
                                this.style.color.neg = color
                                this.figure.plot()
                            }}
                        />
                    </li>
                </ul>
            </div>
        )
    }
}

export class Candle extends Drawing {
    public async recalculate_metadata(
        data_range: PlotFinancialState['data_range']
    ): Promise<void> {
        if (data_range) {
            const [start, end] = [
                Math.floor(this.data.length * data_range.start),
                Math.ceil(this.data.length * data_range.end)
            ]
            this.observed_data = this.data.slice(start, end)
            this.min_value = Math.min.apply(
                null, Array.from(
                    this.observed_data, obj => obj.low
                )
            )
            this.max_value = Math.max.apply(
                null, Array.from(
                    this.observed_data, obj => obj.high
                )
            )
        }
    }
    public async plot(): Promise<void> {
        if (this.visible && this.figure.chart.context) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const {open, high, low, close} = this.observed_data[i]
                const style = close - open > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                // Shadow
                this.figure.chart.context.beginPath()
                this.figure.chart.context.moveTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    low
                )
                this.figure.chart.context.lineTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    high
                )
                this.figure.chart.context.strokeStyle = style
                this.figure.chart.context.stroke()
                this.figure.chart.context.closePath()
                // Body
                if (close - open) {  // Rectangle (non-empty body)
                    this.figure.chart.context.fillStyle = style
                    this.figure.chart.context.fillRect(
                        (i + 0.1) * this.figure.scale.width,
                        open,
                        this.figure.scale.width * 0.9,
                        close - open
                    )
                } else {  // Line (empty body)
                    this.figure.chart.context.moveTo(
                        (i + 0.1) * this.figure.scale.width,
                        open
                    )
                    this.figure.chart.context.lineTo(
                        (i + 1) * this.figure.scale.width,
                        close
                    )
                }
            }
            this.figure.chart.context.restore()
        }
    }
    public show_tooltips(i: number): any {
        const {open, high, low, close} = this.observed_data[i]
        this.tooltips = (
            <div key={this.name}>
                <span>open: {Math.round((open + Number.EPSILON) * 100) / 100}</span>
                <span>high: {Math.round((high + Number.EPSILON) * 100) / 100}</span>
                <span>low: {Math.round((low + Number.EPSILON) * 100) / 100}</span>
                <span>close: {Math.round((close + Number.EPSILON) * 100) / 100}</span>
            </div>
        )
        return this.tooltips
    }
    public show_style(): React.ReactElement {
        return (
            <div key={this.name}>
                <label htmlFor={'visible'}>{this.name}</label>
                <input type={'checkbox'} name={'visible'}
                       onChange={(event) => {
                           this.visible = event.target.checked
                           this.figure.plot()
                       }}
                       defaultChecked={this.visible}
                />
                <ul>
                    <li>
                        Positive color: <ColorPalette
                        default={this.style.color.pos}
                        setColor={(color: colorT) => {
                            this.style.color.pos = color
                            this.figure.plot()
                        }}
                    />
                    </li>
                    <li>
                        Negative color: <ColorPalette
                        default={this.style.color.neg}
                        setColor={(color: colorT) => {
                            this.style.color.neg = color
                            this.figure.plot()
                        }}
                    />
                    </li>
                </ul>
            </div>
        )
    }
}

export class VolumeHist extends Hist {
    public async recalculate_metadata(
        data_range: PlotFinancialState['data_range']
    ): Promise<void> {
        if (data_range) {
            const [start, end] = [
                Math.floor(this.data.length * data_range.start),
                Math.ceil(this.data.length * data_range.end)
            ]
            this.observed_data = this.data.slice(start, end)
            this.min_value = Math.min.apply(
                null, Array.from(
                    this.observed_data, obj => obj.volume
                )
            )
            this.max_value = Math.max.apply(
                null, Array.from(
                    this.observed_data, obj => obj.volume
                )
            )
        }
    }
    public async plot(): Promise<void> {
        if (this.visible && this.figure.chart.context) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const {open, close, volume} = this.observed_data[i]
                this.figure.chart.context.fillStyle = close - open > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                this.figure.chart.context.fillRect(
                    (i + 0.1) * this.figure.scale.width,
                    0,
                    this.figure.scale.width * 0.9,
                    volume
                )
            }
            this.figure.chart.context.restore()
        }
    }
    public show_tooltips(i: number): any {
        let {volume} = this.observed_data[i]
        if (volume >= 10 ** 6) {
            volume = `${Math.round((
                volume / 10 ** 6 + Number.EPSILON
            ) * 100) / 100}M`
        } else if (volume >= 10 ** 9) {
            volume = `${Math.round((
                volume / 10 ** 9 + Number.EPSILON
            ) * 100) / 100}B`
        } else {
            volume = Math.round((
                volume / 10 ** 9 + Number.EPSILON
            ) * 100) / 100
        }
        this.tooltips = (
            <span key={this.name}>volume: {volume}</span>
        )
        return this.tooltips
    }
}
