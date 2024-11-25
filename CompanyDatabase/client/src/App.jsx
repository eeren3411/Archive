import React, { useMemo } from "react";
import { AlertProvider, ModalProvider } from "~/components/common";
import Main from "./Main.jsx";

const App = () => {
	return (
		<AlertProvider className="alert-container" timeOut={5000}>
			<ModalProvider overlayIndex={9999}>
				<Main key="main" />
			</ModalProvider>
		</AlertProvider>
	)
};

export default App;

