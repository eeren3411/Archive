import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Overlay } from "./ModalProvider.module.css";

const ModalWrapper = ({
	modal
}) => {
	return modal;
}

const modalContext = createContext(null);

const useModals = useContext.bind(null, modalContext);

const ModalProvider = ({
	overlayIndex = 9999,
	children
}) => {
	const [activeModals, setActiveModals] = useState([]);

	const summonModal = useCallback((component, overlayExit = true) => {
		const id = Date.now();
		setActiveModals((prevModals) => ([
			...prevModals,
			{
				id: id,
				component: component,
				overlayExit: overlayExit
			}
		]))

		return id;
	}, []);

	const removeModal = useCallback((id) => {
		setActiveModals((prevModals) => prevModals.filter((modal) => modal.id !== id))
	}, []);

	const context = useMemo(() => ({
		summonModal,
		removeModal
	}), [summonModal, removeModal]);

	const onOverlayClick = (event) => {
		if (event.target !== event.currentTarget) return;

		const topModal = activeModals[activeModals.length - 1];
		if (topModal.overlayExit) removeModal(topModal.id);
	};


	return (
		<modalContext.Provider value={context} >
			{activeModals.length ? (
				<div className={Overlay} style={{ zIndex: overlayIndex }} onClick={onOverlayClick}>
					{activeModals.map((modal) => (
						<ModalWrapper key={modal.id} modal={modal.component} />
					))}
				</div>
			): null}
			{children}
		</modalContext.Provider>
	);
}

export { ModalProvider, useModals };