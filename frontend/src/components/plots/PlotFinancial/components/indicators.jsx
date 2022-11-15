import {dtype_to_field} from '../../../forms/utils'
import ColorMixer from '../../ColorMixer/ColorMixer'
import {Figure} from './figures'
import {Line, Hist} from './drawings'

class Indicator {
    constructor(template) {
        this.verbose_name = template.verbose_name
        this.alias = template.alias
        this.args = template.args
        this.separate = template.separate
        this.plots = template.plots
        this.isTemplate = true
        this.selected = false
    }
}

class IndicatorInstance {
    constructor(instance, template, row) {
        this.template = template
        this.verbose_name = instance.verbose_name
        this.args = instance.args
        this.active = true
        // TODO (non)Separate
        // if (template.separate) {
        //     this.figure = new Figure(
        //         `${template.alias}_${row}`,
        //         850, 192,
        //         row, row + 1,
        //         0, 0.1, 0, 0.1,
        //         10, '#d9d9d9', 1,
        //         4, '#d9d9d9', 1,
        //         1
        //     )
        // } else {
        //
        // }
        this.figure = new Figure(
            `${template.alias}_${row}`,
            850, 192,
            row, row + 1,
            0, 0.1, 0, 0.1,
            10, '#d9d9d9', 1,
            4, '#d9d9d9', 1,
            1
        )
        Object.entries(instance.data).forEach(
            ([key , value]) => {
                switch (this.template.plots[key]) {
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
        this.isTemplate = false
        this.selected = true
    }
    get slug() {
        return this.verbose_name.replace(' ', '_')
    }
}

class IndicatorManager {
    constructor(available, setColor, calculateIndicator) {
        this.available = available.map(
            template => new Indicator(template)
        )
        this.calculated = []
        this.props = {
            setColor: setColor,
            calculateIndicator: calculateIndicator
        }
    }
    get active() {
        return this.calculated.filter(i => i.active)
    }
    get selected() {
        return this.available.find(i => i.selected) ||
            this.calculated.find(i => i.selected)
    }
    set selected(indicator) {
        if (indicator !== null) {
            if (indicator.isTemplate) {
                if (this.selected && this.selected.isTemplate) {
                    this.available[
                        this.available.indexOf(
                            this.available.find(
                                i => i.selected
                            )
                        )
                    ].selected = false
                }
                this.available[
                    this.available.indexOf(
                        this.available.find(
                            i => i.verbose_name === indicator.verbose_name
                        )
                    )
                ].selected = true
            } else {
                if (this.selected && !this.selected.isTemplate) {
                    this.calculated[
                        this.calculated.indexOf(
                            this.calculated.find(
                                i => i.selected
                            )
                        )
                    ].selected = false
                }
                this.calculated[
                    this.calculated.indexOf(
                        this.calculated.find(
                            i => i.verbose_name === indicator.verbose_name
                        )
                    )
                ].selected = true
            }
        } else {
            if (this.selected && this.selected.isTemplate) {
                this.available[
                    this.available.indexOf(
                        this.available.find(
                            i => i.selected
                        )
                    )
                ].selected = false
            } else if (this.selected && !this.selected.isTemplate) {
                this.calculated[
                    this.calculated.indexOf(
                        this.calculated.find(
                            i => i.selected
                        )
                    )
                ].selected = false
            }
        }
    }
    append(indicator) {
        let instance
        if (this.selected && !this.selected.isTemplate) {
            instance = new IndicatorInstance(
                indicator, this.available.find(
                    i => i.alias === indicator.alias
                ), this.selected.figure.position.row.start
            )
            this.calculated[
                this.calculated.indexOf(
                    this.calculated.find(
                        i => i.selected
                    )
                )
            ] = instance
        } else {
            instance = new IndicatorInstance(
                indicator, this.available.find(
                    i => i.alias === indicator.alias
                ), this.calculated.length + 3
            )
            this.calculated.push(instance)
            this.selected = instance
        }
    }
    toggle(indicator) {
        this.calculated[
            this.calculated.indexOf(
                this.calculated.find(
                    i => i.verbose_name === indicator.verbose_name
                )
            )
        ].active = !indicator.active
    }
    remove(indicator) {
        this.calculated.splice(
            this.calculated.indexOf(
                this.calculated.find(
                    i => i.verbose_name === indicator.verbose_name
                )
            ), 1
        )
    }
    get args() {
        if (this.selected) {
            return (
                <form className={'indicator_form'} onSubmit={this.props.calculateIndicator}>
                    {Object.entries(this.selected.args).map(([key, value]) =>
                        <div key={key}>
                            <label htmlFor={key}>{key}</label>
                            {this.selected.isTemplate ?
                                dtype_to_field(key, value) :
                                dtype_to_field(
                                    key, this.selected.template.args[key], value
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
    setColor(color) {
        this.calculated[
            this.calculated.indexOf(
                this.calculated.find(
                    indicator => indicator.selected
                )
            )
        ].style.color = color
        this.props.setColor(this)
    }
    get style() {
        if (this.selected && !this.selected.isTemplate) {
            return (
                <ul>
                    <li>
                        <ColorMixer
                            default={this.selected.style.color}
                            setColor={this.setColor}
                        />
                    </li>
                </ul>
            )
        } else {
            return <span>...</span>
        }
    }
}

export {Indicator, IndicatorManager}
