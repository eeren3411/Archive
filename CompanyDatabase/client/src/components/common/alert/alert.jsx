import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import {AlertContainer, Alert, FadeOut} from './alert.module.css';

const AlertComponent = ({
	message,
	type = 0, // -2 error, -1 warning, 0 natural, 1 info, 2 success
	alertTimeout = 5000,
	onRemove
}) => {
	const className = useMemo(() => {
		switch (type) {
			case -2:
				return 'error';
			case -1:
				return 'warning';
			case 0:
				return 'natural';
			case 1:
				return 'info';
			case 2:
				return 'success';
			default:
				return 'natural';
		}
	}, [type]);

	const [fadingOut, setFadingOut] = useState(false);

	const fullOpaqueDuration = useMemo(() => {
		return alertTimeout * 0.8;
	}, [alertTimeout]);

	const fadeOutDuration = useMemo(() => {
		return alertTimeout * 0.2;
	}, [alertTimeout]);

	const removeDebounce = useRef(null);
	const fadeOutDebounce = useRef(null);

	const onMouseEnter = () => {
		clearTimeout(removeDebounce.current);
		clearTimeout(fadeOutDebounce.current);
		setFadingOut(false);
	}

	const onMouseLeave = () => {
		removeDebounce.current = setTimeout(() => onRemove(), alertTimeout);
		fadeOutDebounce.current = setTimeout(() => setFadingOut(true), fullOpaqueDuration);
	}

	useEffect(() => {
		onMouseLeave();
	})

	return (
		<div className={`alert ${className} ${Alert} ${fadingOut ? FadeOut : ""}`} style={{transitionDuration: fadeOutDuration}} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
			<span>
				{message}
			</span>
			<button onClick={onRemove}>X</button>
		</div>
	)
}

const AlertContext = createContext(null);

const useAlert = useContext.bind(null, AlertContext);

const AlertProvider = ({
	timeOut = 5000,
	className,
	children
}) => {
	const [alerts, setAlerts] = useState([]);

	const removeAlert = (id) => {
		setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
	}

	const createAlert = useMemo(() => (message, type = 0) => {
		setAlerts(prevAlerts => {
			const id = Date.now();

			return [
				...prevAlerts,
				{
					id: id,
					component: <AlertComponent key={id} message={message} type={type} alertTimeout={timeOut} onRemove={removeAlert.bind(null, id)} />
				}
			]
		});
	}, [timeOut]);

	return (
		<AlertContext.Provider value={{createAlert}}>
			<div className={`${AlertContainer} ${className || ""}`}>
				{alerts.map(alert => alert.component)}
			</div>
			{children}
		</AlertContext.Provider>
	)
}

export {AlertProvider, useAlert};