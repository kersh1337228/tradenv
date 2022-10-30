import React from 'react'
import ListField from './ListField'


export function dtype_to_field(name, dtype) {
    switch (dtype) {
        case 'int':
            return <input name={name} type={'number'} required/>
        case 'str':
            return <input name={name} type={'text'} required/>
        case 'list[int]':
            return <ListField name={name} type={'int'} />
        default:
            return <select name={name}>
                {dtype.map(value =>
                    <option value={value} key={value}>
                        {value}
                    </option>
                )}
            </select>
    }
}
