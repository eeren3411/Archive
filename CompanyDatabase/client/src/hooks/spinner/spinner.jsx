import React, { useEffect, useRef } from "react";
import { ImSpinner9 } from "react-icons/im";
import { useModals } from "~/components/common"

import { Spinner } from "./Spinner.module.css"

const SpinnerComponent = () => {
	return (
		<div className="spinner">
			<ImSpinner9 className={Spinner}/>
		</div>
	)
}

const useSpinner = () => {
	const { summonModal, removeModal } = useModals();

	const spinnerId = useRef(null);

	const spin = () => {
		if (spinnerId.current) return;
		spinnerId.current = summonModal(<SpinnerComponent />, false);
	}

	const stop = () => {
		removeModal(spinnerId.current);
		spinnerId.current = null;
	}

	useEffect(() => {
		return () => {
			stop();
		}
	}, [])

	return [spin, stop];
}

export { useSpinner }