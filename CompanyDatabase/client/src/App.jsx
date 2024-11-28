import React, { useMemo } from "react";
import { AlertProvider } from "./components/common/alert";
import { ModalProvider } from "./components/common/modals";
import Main from "./main.jsx";

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

