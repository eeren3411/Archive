import React, { useState, useEffect } from "react";
import { Table } from "./components/common";
import { CompanyModal } from "./components/CompanyModal";
import { faker } from "@faker-js/faker";

const App = () => {
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

  console.log("App rerendered");
  return (
    <div className="container">
      <Table columns={columns} data={data} uniqueKey={"id"} key={"table"} onEdit={onEdit} onDelete={null} defaultSortSettings={{key: "id", direction: true}} className={"custom-table"} pageSize={5}/>
      <button className="edit-button" onClick={updateCompany}>Update Company</button>

      <button onClick={() => setCompanyModalData(true)}>Open Modal</button>
      {companyModalData && <CompanyModal className="company-modal" data={companyModalData} onClose={onClose} onSubmit={onSubmit} />}
    </div>
  );
};

export default App;

