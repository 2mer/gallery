import Viewer from './Viewer';

function App() {
	return (
		<>
			<div className='flex flex-col h-full w-full relative'>
				<Viewer />

				<p className='fixed text-center text-white bottom-2 right-4'>
					<code>All rights reserved. Tomer Atar 2024 ©</code>
				</p>
			</div>
		</>
	);
}

export default App;
