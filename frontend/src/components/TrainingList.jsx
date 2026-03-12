import React from "react";
import { useT } from "../context/LanguageContext";

const stripHtmlTags = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return doc.body.textContent || "";
};

function TrainingList({
  data,
  onEdit,
  onDelete,
  search,
  setSearch,
  nextPage,
  prevPage
}) {
  const t = useT();

  return (
    <div className="card">
      <h3>{t("training.listTitle")}</h3>

      <input
        placeholder={t("common.search") + "..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>{t("training.colName")}</th>
            <th>{t("common.description")}</th>
            <th>{t("training.colDuration")}</th>
            <th>{t("training.colMandatory")}</th>
            <th>{t("training.colScore")}</th>
            <th>{t("training.colValidity")}</th>
            <th>{t("common.action")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <td>{item.training_name}</td>
              <td>{stripHtmlTags(item.description)}</td>
              <td>{item.duration}</td>
              <td>{item.mandatory ? t("common.yes") : t("common.no")}</td>
              <td>{item.passing_score}</td>
              <td>{item.validity}</td>
              <td>
                <button onClick={() => onEdit(item)}>{t("common.edit")}</button>
                <button onClick={() => onDelete(item.name)}>{t("common.delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={prevPage}>{t("common.previous")}</button>
        <button onClick={nextPage}>{t("common.next")}</button>
      </div>
    </div>
  );
}

export default TrainingList;
