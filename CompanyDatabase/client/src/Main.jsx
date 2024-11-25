import React, { useState, useEffect, useRef, memo } from "react";
import { useModals } from "~/components/common";
import { CompanyModal } from "~/components/CompanyModal";

const STATES = {
	LOGIN_SCREEN: 0,
	TABLE_SCREEN: 1
}

const Main = memo(() => {
	console.log("main rendered");

	const overlayObj = useModals();
	const { summonModal, removeModal } = overlayObj;

	const click = () => {
		let id = null;
		const callback = () => {
			removeModal(id);
		};
		id = summonModal(<CompanyModal className="company-modal" onClose={callback} />);
		console.log(id);
	}
	
	return (
		<div className="container">
			<button onClick={click}>summon</button>
		</div>
	)
});

export default Main;

