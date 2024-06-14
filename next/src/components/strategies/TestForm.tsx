'use client';

import {
    useState
} from 'react'
import Select from '../misc/form/Select';
import {
    serverRequest
} from '../../utils/actions';

export default function TestForm(
    {
        portfolios
    }: {
        portfolios: PortfolioPartial[];
    }
) {
    const [startTimes, setStartTimes] = useState<string[]>([]);
    const [endTimes, setEndTimes] = useState<string[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);

    // Step 3: End date select
    const end_dates = ['initial', 'portfolio'].indexOf(this.state.step) === -1 ? this.state.end_dates.length ?
        <select id="id_range_end" name="range_end"
                onChange={this.end_date_choose}>
            <option>Choose the end date.</option>
            {this.state.end_dates.map(date =>
                <option value={date} key={date}>{date}</option>
            )}
        </select>: null : null
    // Step 4: Strategy select
    const strategy_list = ['initial', 'portfolio', 'range_start'].indexOf(this.state.step) === -1 ?
        this.state.strategies.length ?
            <select id="id_strategies"
                    name="strategies"
                    onChange={this.strategy_choose}
                    multiple
            >
                {this.state.strategies.map(strategy =>
                    <option value={strategy.alias} key={strategy.alias}>
                        {strategy.verbose_name}
                    </option>
                )}
            </select>: <span>No strategies yet.</span> : null
    // Step 5: Strategy arguments input
    const arguments_form = this.state.selected_strategies.length ?
        <div id={'id_strategies_args'}>
            {this.state.strategies.filter(
                strategy => this.state.selected_strategies.includes(strategy.alias)
            ).map(strategy =>
                <fieldset id={`id_${strategy.alias}`} key={strategy.alias} name={strategy.alias}>
                    <legend>{strategy.verbose_name}</legend>
                    {Object.entries(strategy.args).map(([name, dtype]) =>
                        <div key={name}>
                            <label htmlFor={`${strategy.alias}_${name}`}>
                                {(() => {
                                    let s = name.replace('_', ' ')
                                    return s.charAt(0).toUpperCase() + s.slice(1)
                                })()}
                            </label>
                            {dtype_to_field(`${strategy.alias}_${name}`, dtype)}
                        </div>
                    )}
                </fieldset>
            )}
        </div> : null
    return(
        <div className="analysis_form">
            <form
                action={}
            >
                {/* Step 1: Portfolio select */}
                {portfolios.length ? <Select
                    name="portfolio"
                    errors={}
                    label={true}
                    required={true}
                    onChange={async (event) => {
                        const slug = event.target.value;
                        if (slug) {
                            const response = await serverRequest(
                                'analysis/form',
                                'GET', {
                                    step: 'portfolio',
                                    slug
                                }
                            );

                            if (response.ok)
                                setStartTimes(response.data.dates);
                            
                            await ajax(
                                'http://localhost:8000/analysis/api/form',
                                'GET',
                                (response: {dates: string[]}) => {
                                    this.setState({
                                        dates: response.dates,
                                        errors: {},
                                        step: 'portfolio'
                                    })
                                },
                                (response) => {
                                    this.setState({
                                        errors: response.errors,
                                        dates: [],
                                        end_dates: [],
                                        step: 'initial'
                                    })
                                },
                                {
                                    step: 'portfolio',
                                    slug: value
                                }
                            )
                        } else {
                            this.setState({
                                dates: [],
                                errors: {},
                                step: 'initial'
                            })
                        }
                    }}
                >
                    <option>
                        Choose the portfolio
                    </option>
                    {portfolios.map(portfolio =>
                        <option
                            key={portfolio.slug}
                            value={portfolio.slug}
                        >
                            {portfolio.name}
                        </option>
                    )}
                </Select> : <span>
                    No portfolios found
                </span>}
                {/* Step 2: Start time select */}
                {this.state.step !== 'initial' ? this.state.dates.length ?
                    <select id="id_range_start" name="range_start"
                            onChange={this.start_date_choose}>
                        <option>Choose the start date.</option>
                        {this.state.dates.map(date =>
                            <option value={date} key={date}>{date}</option>
                        )}
                    </select>: null : null}
                {/* Step 3: End time select */}
                {end_dates}
                {/* Step 4: Strategy select */}
                {strategy_list}
                {/* Step 5: Strategy setup */}
                {arguments_form}
                {this.state.step === 'strategy' ?
                    <input
                        type={'submit'}
                        value={'Submit'}
                        className={'button_div'}
                        id={'analyse_button'}
                    /> : null
                }
            </form>
        </div>
    )
}
