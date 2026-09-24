import "./DataTable.css";

export default function DataTable({
  columns = [],
  rows,
  data,
  getRowKey = (row, index) => row.id ?? index,
  emptyMessage = "No records found.",
}) {
  const tableRows = rows || data || [];

  if (!tableRows.length) {
    return (
      <div className="data-table__empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tableRows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}