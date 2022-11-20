import React from 'react'
import {Route, BrowserRouter, Routes} from 'react-router-dom'
import AnalysisForm from './components/analysis/AnalysisForm'
import QuotesList from './components/quotes/QuotesList'
import QuotesDetail from './components/quotes/QuotesDetail'
import PortfolioList from './components/portfolio/PortfolioList'
import PortfolioDetail from "./components/portfolio/PortfolioDetail";
import LogList from "./components/log/LogList";
import LogDetail from "./components/log/LogDetail";
import NavBar from "./components/general/NavBar";
import NotFound from "./components/general/NotFound";


function App() {
  return (
      <BrowserRouter>
        <header>
          <NavBar />
        </header>
        <Routes>
          {/*Analysis app paths*/}
          <Route path={'/analysis'} element={<AnalysisForm />} />
          {/*Quotes app paths*/}
          <Route path={'/quotes/list'} element={<QuotesList />} />
          <Route path={'/quotes/detail/:slug'} element={<QuotesDetail />} />
          {/*Portfolio app paths*/}
          <Route path={'/portfolio/list'} element={<PortfolioList />} />
          <Route path={'/portfolio/detail/:slug'} element={<PortfolioDetail />} />
          {/*Log app paths*/}
          <Route path={'/log/list'} element={<LogList />} />
          <Route path={'/log/detail/:slug'} element={<LogDetail />} />
          {/*Arbitrary wrong route*/}
          <Route path={'*'} element={<NotFound />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App;
