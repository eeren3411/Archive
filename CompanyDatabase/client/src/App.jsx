import React, { useMemo } from "react";
import { AlertProvider } from "./components/common";
import Main from "./Main.jsx";

const App = () => {
	return (
		<AlertProvider className="alert-container" timeOut={5000}>
			<Main key="main" />
		</AlertProvider>
	)
};

export default App;

