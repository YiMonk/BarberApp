import { useCallback } from "react";

export function useDataExport() {
  const exportToCSV = useCallback(
    (data: Array<Record<string, any>>, filename: string) => {
      if (data.length === 0) return;

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Escape quotes and wrap in quotes if contains comma
              if (typeof value === "string" && value.includes(",")) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const exportToJSON = useCallback(
    (data: Array<Record<string, any>>, filename: string) => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const generateReport = useCallback(
    (
      title: string,
      data: Array<Record<string, any>>,
      filename: string
    ) => {
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .timestamp { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="timestamp">Generado: ${new Date().toLocaleString("es-CL")}</p>
  <table>
    <thead>
      <tr>
        ${Object.keys(data[0])
          .map((key) => `<th>${key}</th>`)
          .join("")}
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${Object.values(row)
              .map((val) => `<td>${val}</td>`)
              .join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>
      `;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.html`;
      link.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    exportToCSV,
    exportToJSON,
    generateReport,
  };
}
