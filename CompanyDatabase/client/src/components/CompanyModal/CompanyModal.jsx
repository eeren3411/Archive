import React from "react";
import { ModalBase } from "../common";
import { faker } from "@faker-js/faker";
import { ModalContainer, ModalHeader, ModalCloseButton, ModalBody, ModalButtonContainer, ModalButton } from "./CompanyModal.module.css";

const CompanyModal = ({
	data,
	className,
	onClose,
	onSubmit
}) => {
	const handleSubmit = (e) => {
		e.preventDefault();
		
		onSubmit({
			id: data.id,
			...Object.fromEntries(new FormData(e.target))
		}, data);
	}

	return (
		<ModalBase className={`${ModalContainer} ${className || ""}`} onClose={onClose}>
			<div className={ModalHeader}>
				<h2>Details</h2>
				<button className={`modal-close-button ${ModalCloseButton}`} onClick={onClose}>X</button>
			</div>
			<form onSubmit={handleSubmit}>
				<div className={ModalBody}>
					<label>Fake Name</label>
					<input type="text" name="fake_name" defaultValue={data.fake_name || ""} placeholder={faker.company.name()} required/>

					<label>Real Name</label>
					<input type="text" name="real_name" defaultValue={data.real_name || ""} required/>

					<label>Info</label>
					<textarea name="info" defaultValue={data.info || ""}/>

					<div className={ModalButtonContainer}>
						<button className={`modal-cancel-button ${ModalButton}`} type="button" onClick={onClose}>Cancel</button>
						<button className={`modal-submit-button ${ModalButton}`} type="submit">Save</button>
					</div>
				</div>
			</form>
		</ModalBase>
	)
}

export default CompanyModal;
