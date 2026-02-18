import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { ServiceDetail } from './pages/ServiceDetail';
import { Works } from './pages/Works';
import { Prototypes } from './pages/Prototypes';
import { BRAND } from './constants';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/service" element={<Services />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/works" element={<Works />} />
          <Route path="/prototypes" element={<Prototypes />} />
          {/* Contact routes usually redirect to LINE or anchor, handled in Nav */}
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;