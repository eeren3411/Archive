import React, { useState, useMemo, useRef, memo } from 'react';
import { CustomTable, Controller, Sortable, asc, desc, OneLinerWrapper, ThreeLinerWrapper, EditButton, DeleteButton } from './Table.module.css';
import { FaRegTrashAlt, FaEdit } from 'react-icons/fa'

const TableRow = memo(({
    columns,
    data,
    onEdit,
    onDelete
}) => {
    return (
        <tr>
            {columns.map((column) => (
                <td key={data[column.key]}>
                    <span className={`${column.wrap ? ThreeLinerWrapper : OneLinerWrapper}`}>
                        {data[column.key]}
                    </span>
                </td>
            ))}
            {onEdit && <td><button className={EditButton} onClick={onEdit}><span><FaEdit /></span></button></td>}
            {onDelete && <td><button className={DeleteButton} onClick={onDelete}><span><FaRegTrashAlt /></span></button></td>}
        </tr>
    )
});

const Table = ({ 
    columns,
    data,
    uniqueKey,
    sortChanged,
    defaultSortSettings,
    editTitle,
    onEdit,
    deleteTitle,
    onDelete,
    pageSize = 10,
    className,
}) => {
    const isOnEditFunction = typeof onEdit === "function";
    const isOnDeleteFunction = typeof onDelete === "function";

    const [page, setPage] = useState(0);

    const safeDefaultSortSettings = defaultSortSettings && defaultSortSettings.key && {
        direction: true,
        ...defaultSortSettings
    }
    const [sortSettings, setSortSettings] = useState(safeDefaultSortSettings ||{
        key: null,
        direction: null
    });

    const sortedData = useMemo(() => {
        if (!sortSettings.key) return [...data];
        return [...data].sort((a, b) => {
            const valueA = a[sortSettings.key];
            const valueB = b[sortSettings.key];
            if (typeof valueA === "number" && typeof valueB === "number") {
                return sortSettings.direction ? valueA - valueB : valueB - valueA;
            }
            return sortSettings.direction ? valueA.toString().localeCompare(valueB) : valueB.toString().localeCompare(valueA);
        });
    }, [sortSettings, data]);

    const pageContent = useMemo(() => {
        return pageSize === Infinity ? sortedData : sortedData.slice(page * pageSize, page * pageSize + pageSize);
    }, [sortedData, page, pageSize]);

    const ref = useRef({
        rowCache: Object.create(null)
    });

    const rowCache = ref.current.rowCache;

    useMemo(() => {
        if (!uniqueKey) return;
        pageContent.forEach((row) => {
            const cachedRow = rowCache[row[uniqueKey]];
            if (
                !cachedRow || 
                Object.keys(row).some((key) => row[key] !== cachedRow[key])
            ) {
                console.log(`Rendering table row: ${row[uniqueKey]}`);
                rowCache[row[uniqueKey]] = {
                    ...row,
                    component: <TableRow
                        key={row[uniqueKey]}
                        columns={columns}
                        data={row}
                        onEdit={isOnEditFunction ? onEdit.bind(this, row) : null}
                        onDelete={isOnDeleteFunction ? onDelete.bind(this, row) : null}
                    />
                };
            }
        });
    }, [pageContent])

    const pageCount = Math.ceil(data.length / pageSize) || 1; // In case pageSize = infinity

    const handleSort = (column) => {
        if (!column.sortable) return;
        if (sortSettings.key === column.key) {
            setSortSettings({
                key: column.key,
                direction: !sortSettings.direction
            });
        } else {
            setSortSettings({
                key: column.key,
                direction: true
            });
        }
        typeof sortChanged === "function" && sortChanged(sortSettings);
    }

    return (
        <div className={`${CustomTable} ${className || ''}`	}>
            <table>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                className={`${sortSettings.key === column.key ? (sortSettings.direction ? asc : desc) : ''} ${column.sortable ? Sortable : ''}`}
                                key={column.key}
                                onClick={handleSort.bind(this, column)}
                            >
                                <span>
                                    {column.label}
                                </span>
                            </th>
                        ))}
                        {isOnEditFunction && <th><span>{editTitle || "Edit"}</span></th>}
                        {isOnDeleteFunction && <th><span>{deleteTitle || "Delete"}</span></th>}
                    </tr>
                </thead>
                <tbody>
                    {pageContent.map((row) => (
                        (uniqueKey && rowCache[row[uniqueKey]]?.component) ||
                        <TableRow
                            key={uniqueKey && row[uniqueKey]}
                            columns={columns}
                            data={row}
                            onEdit={isOnEditFunction ? onEdit.bind(this, row) : null}
                            onDelete={isOnDeleteFunction ? onDelete.bind(this, row) : null}
                        />
                    ))}
                </tbody>
            </table>
            <div style={{display: pageCount === 1 ? "none" : "block"}} className={Controller}>
                <button style={{ visibility: page === 0 ? "hidden" : "visible" }} onClick={() => setPage(0)}><span>&lt;&lt;</span></button>
                <button style={{ visibility: page === 0 ? "hidden" : "visible" }} onClick={() => setPage(page - 1)}><span>&lt;</span></button>
                <select value={page} onChange={(e) => setPage(parseInt(e.target.value))}>
                    {
                        Array.from({ length: pageCount }, (_, index) => (
                            <option
                                key={index}
                                value={index}
                            >
                                {index + 1}
                            </option>
                        ))
                    }
                </select>
                <button style={{ visibility: page === pageCount - 1 ? "hidden" : "visible" }} onClick={() => setPage(page + 1)}><span>&gt;</span></button>
                <button style={{ visibility: page === pageCount - 1 ? "hidden" : "visible" }} onClick={() => setPage(pageCount - 1)}><span>&gt;&gt;</span></button>
            </div>
        </div>
    )
}

export default Table;
