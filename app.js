const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
    state_id AS stateId,state_name AS stateName,population
    FROM
    state
    ORDER BY
    state_id;`;
  const stateArray = await db.all(getStatesQuery);
  response.send(stateArray);
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    state_id AS stateId,state_name AS stateName,population
    FROM
    state
    WHERE
    state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

//API3
app.post("/districts/", async (request, response) => {
  const districtsDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtsDetails;
  const addDistrictDetails = `
    INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addDistrictDetails);
  const distid = dbResponse.lastID;
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
    district_id AS districtId,district_name AS districtName,state_id AS stateId,cases,cured,active,deaths
    FROM
    district
    WHERE
    district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
    district
    WHERE
    district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictDetails = `
    UPDATE
    district
    SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE
    district_id=${districtId};`;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetail = `
    SELECT
    SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths
    FROM
    district NATURAL JOIN state
    WHERE
    state_id=${stateId};`;
  const state = await db.get(getStateDetail);
  response.send(state);
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetail = `
    SELECT
    state_name AS stateName
    FROM
    state INNER JOIN district
    WHERE
    district_id=${districtId};`;
  const name = await db.get(getDistrictDetail);
  response.send(name);
});
module.exports = app;
