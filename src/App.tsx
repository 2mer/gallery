import Viewer from './Viewer';
import { Link, Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

function App() {
	return (
		<Router hook={useHashLocation}>
			<div className='flex flex-col h-full w-full relative'>
				<p className='fixed text-center text-white top-2 left-4 z-10 flex gap-10'>
					<code>Tomer Atar's Asset Gallery</code>

					<Link to='/' className='font-mono'>
						home
					</Link>
					<Link to='/byHeight' className='font-mono'>
						sorted:height
					</Link>
				</p>

				<Viewer />

				<p className='fixed text-center text-white bottom-2 right-4'>
					<code>All rights reserved. Tomer Atar 2024 ©</code>
				</p>
			</div>
		</Router>
	);
}

export default App;
