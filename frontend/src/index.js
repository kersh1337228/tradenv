import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import NavigationBar from './components/NavigationBar'


ReactDOM.render(
    <NavigationBar />,
    $('#globalnav').get(0)
)

ReactDOM.render(
    <App />,
    $('#content').get(0)
)
