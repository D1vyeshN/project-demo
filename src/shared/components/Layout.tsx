import { useNavigation, Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Loading } from './Loading';

export function Layout() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className={`md:pl-64 transition-all duration-300`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {isLoading ? <Loading /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
