import React from 'react'
import {Route, BrowserRouter, Routes} from 'react-router-dom'
import AnalysisForm from './components/analysis/AnalysisForm'
import QuotesList from './components/quotes/QuotesList'
import QuotesDetail from './components/quotes/QuotesDetail'
import PortfolioList from './components/portfolio/PortfolioList'
import PortfolioDetail from "./components/portfolio/PortfolioDetail";
import StrategyList from "./components/strategy/StrategyList";
import StrategyDetail from "./components/strategy/StrategyDetail";


function App() {
  return (
      <BrowserRouter>
        <Routes>
            {/*Analysis app paths*/}
            <Route path={'/analysis/'} element={<AnalysisForm />} />
            {/*Quotes app paths*/}
            <Route path={'/quotes/list/'} element={<QuotesList />} />
            <Route path={'/quotes/detail/:slug/'} element={<QuotesDetail />} />
            {/*Portfolio app paths*/}
            <Route path={'/portfolio/list/'} element={<PortfolioList />} />
            <Route path={'/portfolio/detail/:slug/'} element={<PortfolioDetail />} />
            {/*strategy app paths*/}
            <Route path={'/strategy/list/'} element={<StrategyList />} />
            <Route path={'/strategy/detail/:slug/'} element={<StrategyDetail />} />
            {/*Log app paths*/}
            {/*<Route path={'/log/list/'} element={<LogList />} />*/}
        </Routes>
      </BrowserRouter>
  )
}


export default App
