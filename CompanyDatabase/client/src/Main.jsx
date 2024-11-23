import React, { useState, useEffect, memo } from "react";
import { faker } from "@faker-js/faker";

import { Table } from "~/components/common";
import { useAlert } from "~/components/common";
import { CompanyModal } from "~/components/CompanyModal";

const Main = memo(() => {
	const [companyModalData, setCompanyModalData] = useState(null);

	const columns = [
		{key: "id", label: "ID", sortable: true, wrap: false},
		{key: "fake_name", label: "Fake Name", sortable: true, wrap: false},
		{key: "real_name", label: "Real Name", sortable: true, wrap: false},
		{key: "info", label: "Info", wrap: true},
	];

	const [data, setData] = useState(Array.from({ length: 10 }, (_, index) => ({
		id: index + 1,
		fake_name: faker.company.name(),
		real_name: faker.company.name(),
		info: faker.lorem.words(30)
	})));

	const updateCompany = () => {
		setData((prevData) => {
			return [
				...prevData,
				{
					id: prevData.length + 1,
					fake_name: faker.company.name(),
					real_name: faker.company.name(),
					info: faker.lorem.words(30)
				}
			]
		})
	}

	const onEdit = (row) => {
		setCompanyModalData(row);
	}

	const onSubmit = (newData, oldData) => {
		setData((prevData) => {
			return prevData.map((item) => item.id === oldData.id ? newData : item);
		});
		setCompanyModalData(null);
	}

	const onDelete = (row) => { 
		setData((prevData) => prevData.filter((item) => item.id !== row.id));
	}

	const onClose = () => {
		setCompanyModalData(null);
	}

	const { createAlert } = useAlert()

	console.log("App rerendered");
	return (
		<div className="container">
			<Table columns={columns} data={data} uniqueKey={"id"} key={"table"} onEdit={onEdit} onDelete={null} defaultSortSettings={{key: "id", direction: true}} className={"custom-table"} pageSize={5}/>
			<button className="edit-button" onClick={updateCompany}>Update Company</button>

			<button onClick={() => setCompanyModalData(true)}>Open Modal</button>
			{companyModalData && <CompanyModal className="company-modal" data={companyModalData} onClose={onClose} onSubmit={onSubmit} />}

			<button onClick={() => createAlert("Error", -2)}>Show Error</button>
			<button onClick={() => createAlert("Warning", -1)}>Show Warning</button>
			<button onClick={() => createAlert("Natural", 0)}>Show Natural</button>
			<button onClick={() => createAlert("İnfo", 1)}>Show Info</button>
			<button onClick={() => createAlert("Success", 2)}>Show Success</button>
		</div>
	);
});

export default Main;

