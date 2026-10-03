import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar />
      <div className="app-content flex flex-1 flex-col">
        <Header />
        <main className="app-main flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
