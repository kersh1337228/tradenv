import {dtype_to_field} from "../../../../utils/functions"
import {Figure} from './figures'
import {Line, Hist} from './drawings'
import {ArgsType} from "../../../../types/general";
import {IndicatorAvailableType, IndicatorCalculatedType} from "../../../../types/indicator";
import React from "react";

export class Indicator implements IndicatorAvailableType {
    public verbose_name: string
    public alias: string
    public args: ArgsType
    public separate: boolean
    public plots: {
        [key: string]: 'line' | 'hist'
    }
    public selected: boolean
    constructor(template: IndicatorAvailableType) {
        this.verbose_name = template.verbose_name
        this.alias = template.alias
        this.args = template.args
        this.separate = template.separate
        this.plots = template.plots
        this.selected = false
    }
    public get isTemplate(): true {
        return true
    }
}

export class IndicatorInstance implements Omit<
    IndicatorCalculatedType,
    'alias' | 'data'
> {
    public template: Indicator | undefined
    public verbose_name: string
    public args: {
        [key: string]: number | number[]
    }
    public active: boolean
    public selected: boolean
    public figure: Figure
    public constructor(
        instance: IndicatorCalculatedType,
        template: Indicator | undefined,
        row: number,  // Separate plot grid position
        mainFigure: Figure  // Main figure reference for non-separate plots
    ) {
        this.template = template
        this.verbose_name = instance.verbose_name
        this.args = instance.args
        this.active = true
        if (template?.separate) {
            this.figure = new Figure(
                `${template.alias}_${row}`,
                850, 192,
                row, row + 1,
                0, 0.1, 0, 0.1,
                10, '#d9d9d9', 1,
                4, '#d9d9d9', 1,
                1
            )
        } else {
            this.figure = mainFigure
        }
        Object.entries(instance.data).forEach(
            ([key , value]) => {
                switch (this.template?.plots[key]) {
                    case 'line':
                        this.figure.drawings.push(
                            new Line(key, value, this.figure, {
                                color: 'rgba(255, 100, 0, 1)',
                                width: 1
                            })
                        )
                        break
                    case 'hist':
                        this.figure.drawings.push(
                            new Hist(key, value, this.figure, {
                                color: {
                                    pos: '#53e9b5',
                                    neg: '#da2c4d'
                                }
                            })
                        )
                        break
                }
            }
        )
        this.selected = true
    }
    public get isTemplate(): false {
        return false
    }
    public get slug(): string {
        return this.verbose_name.replace(' ', '_')
    }
}

export class IndicatorManager {
    public available: Indicator[]
    public calculated: IndicatorInstance[]
    public props: {
        setColor: Function,
        calculateIndicator: React.FormEventHandler<HTMLFormElement>,
        mainFigure: Figure
    }
    public constructor(
        available: IndicatorAvailableType[],
        setColor: Function,
        calculateIndicator: React.FormEventHandler<HTMLFormElement>,
        mainFigure: Figure
    ) {
        this.available = available.map(
            template => new Indicator(template)
        )
        this.calculated = []
        this.props = {
            setColor: setColor,
            calculateIndicator: calculateIndicator,
            mainFigure: mainFigure
        }
    }
    public get active(): IndicatorInstance[] {
        return this.calculated.filter(i => i.active)
    }
    public get selected(): Indicator | IndicatorInstance | undefined | null {
        return this.available.find(i => i.selected) ||
            this.calculated.find(i => i.selected)
    }
    public set selected(indicator: Indicator | IndicatorInstance | undefined | null) {
        try {
            this.available[
                this.available.findIndex(
                    i => i.selected
                )
            ].selected = false
        } catch {}
        try {
            this.calculated[
                this.calculated.findIndex(
                    i => i.selected
                )
            ].selected = false
        } catch {}
        if (indicator?.isTemplate) {
            this.available[
                this.available.findIndex(
                    i => i.verbose_name === indicator?.verbose_name
                )
            ].selected = true
        } else {
            this.calculated[
                this.calculated.findIndex(
                    i => i.verbose_name === indicator?.verbose_name
                )
            ].selected = true
        }
    }
    public append(indicator: IndicatorCalculatedType): void {
        let instance
        if (this.selected && !this.selected.isTemplate) {
            instance = new IndicatorInstance(
                indicator,
                this.available.find(
                    i => i.alias === indicator.alias
                ),
                this.selected.figure.position.row.start,
                this.props.mainFigure
            )
            this.calculated[
                this.calculated.findIndex(
                    i => i.selected
                )
            ] = instance
        } else {
            instance = new IndicatorInstance(
                indicator,
                this.available.find(
                    i => i.alias === indicator.alias
                ),
                this.calculated.filter(
                    i => i.template?.separate
                ).length + 3,
                this.props.mainFigure
            )
            this.calculated.push(instance)
            this.selected = instance
        }
    }
    public toggle(indicator: IndicatorInstance): void {
        this.calculated[
            this.calculated.findIndex(
                i => i.verbose_name === indicator.verbose_name
            )
        ].active = !indicator.active
    }
    public remove(indicator: IndicatorInstance): void {
        this.calculated.splice(
            this.calculated.findIndex(
                i => i.verbose_name === indicator.verbose_name
            ), 1
        )
    }
    public get args(): React.ReactElement {
        if (this.selected) {
            return (
                <form className={'indicator_form'} onSubmit={this.props.calculateIndicator}>
                    {Object.entries(this.selected.args).map(([key, value]) =>
                        <div key={key}>
                            <label htmlFor={key}>{key}</label>
                            {this.selected?.isTemplate ?
                                dtype_to_field(key, value) :
                                dtype_to_field(
                                    key, this.selected?.template?.args[key]?
                                        this.selected.template.args[key] : 'int'
                                    , value
                                )
                            }
                        </div>
                    )}
                    <button onClick={() => {
                        this.selected = null
                    }}>Cancel</button>
                    <button type={'submit'}>Apply</button>
                </form>
            )
        } else {
            return <span>...</span>
        }
    }
    public get style(): React.ReactElement {
        if (this.selected && !this.selected.isTemplate) {
            return (
                <ul>
                    {this.selected.figure.drawings.filter(
                        d => {
                            if (this.selected && !this.selected.isTemplate) {
                                return d.name in (this.selected.template?.plots || [])
                            }
                        }
                    ).map(d => d.show_style())}
                </ul>
            )
        } else {
            return <span>...</span>
        }
    }
}
