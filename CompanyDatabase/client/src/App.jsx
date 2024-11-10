import React, { useState, useEffect } from "react";
import Table from "./components/Table/Table.jsx";
import { faker } from "@faker-js/faker";

const App = () => {
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
    setData((prevData) => {
      return prevData.map((item) => {
        if (item.id === row.id) {
          return {
            ...item,
            fake_name: faker.company.name(),
            real_name: faker.company.name(),
            info: faker.lorem.words(30)
          };
        }
        return item;
      })
    });
  }

  const onDelete = (row) => { 
    setData((prevData) => prevData.filter((item) => item.id !== row.id));
  }

  console.log("App rerendered");
  return (
    <div className="container">
      <div className="main-rectangle">
        <Table columns={columns} data={data} uniqueKey={"id"} key={"table"} onEdit={onEdit} onDelete={onDelete} defaultSortSettings={{key: "id", direction: true}} className={"customtable"} pageSize={5}/>
      </div>

      <button className="edit-button" onClick={updateCompany}>Update Company</button>
    </div>
  );
};

export default App;
