import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommandPalette from '../components/CommandPalette';

function Layout({ children }) {
    return (
        <div className="app-layout">
            <Navbar />
            <div className="app-body">
                <Sidebar />
                <main className="app-content">
                    <div className="app-content-inner animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
            <CommandPalette />

            <style>{`
                .app-layout {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .app-body {
                    display: flex;
                    flex: 1;
                }
                .app-content {
                    flex: 1;
                    min-height: calc(100vh - var(--navbar-h));
                    background: var(--color-bg);
                    overflow-x: hidden;
                }
                .app-content-inner {
                    padding: var(--sp-8);
                    max-width: 1280px;
                    margin: 0 auto;
                }
            `}</style>
        </div>
    );
}

export default Layout;
