import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { getCaptcha, fetchCaseDetails } from './api';
import OrdersPage from './pages/Orders'
import CaseOrders from './pages/CaseOrders';

function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<CaseOrders/>}/> 
        <Route path="/orders" element={<OrdersPage/>}/> 
      </Routes>
    </Router>
  )
}

export default App;
