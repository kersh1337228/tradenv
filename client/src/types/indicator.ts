import {ArgsType} from "./general"

export interface IndicatorAvailableType {
    verbose_name: string,
    alias: string,
    args: ArgsType,
    separate: boolean,
    plots: {
        [key: string]: 'line' | 'hist'
    }
}

export interface IndicatorCalculatedType extends Omit<
    IndicatorAvailableType,
    'args' | 'separate' | 'plots'
> {
    args: {
        [key: string]: number | number[]
    },
    data: {
        [key: string]: number[]
    }
}
