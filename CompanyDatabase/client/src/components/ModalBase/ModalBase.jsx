import React, { useState, useMemo, useRef, memo } from 'react';
import { Overlay, Modal } from './ModalBase.module.css';

const ModalBase = ({
    className,
    onClose,
    children,
}) => {
    const onOverlayClick = (event) => {
        if (event.target === event.currentTarget && typeof onClose === "function") onClose();
    };

    return (
        <div className={Overlay} onClick={onOverlayClick}>
            <div className={`${Modal} ${className || ""}`}>
                {children}
            </div>
        </div>
    )
}

export default ModalBase;