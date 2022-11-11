import React from 'react'
import {createRoot} from 'react-dom/client'
import $ from 'jquery'
import App from './App'


createRoot($('#content').get(0)).render(<App />)
