const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dpPath = path.join(__dirname, "todaApplication.db");

app.use(express.json());
let db = null;

const intialiseDBANDServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};

intialiseDBANDServer();

// GET Todo on Filtering

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusPriority = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = null;
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND status = '${status}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';
            `;
      break;
    case hasStatusPriority(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';
            `;
      break;
    default:
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
            `;
  }
  //   console.log(getTodosQuery);
  getTodosArray = await db.all(getTodosQuery);
  response.send(getTodosArray);
});

// Get TODO By Id API

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTODOQuery = `
        SELECT * FROM todo
        WHERE id = ${todoId};
    `;
  const todoArray = await db.get(getTODOQuery);
  response.send(todoArray);
});

// Add Todo API

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoQuery = `
        INSERT INTO todo(id, todo, priority, status)
        VALUES(${id},
                '${todo}',
                '${priority}',
                '${status}'
            );
    `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

// Update Todo API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
        SELECT * FROM todo
        WHERE id = ${todoId};
    `;
  const previousTodoInfo = await db.get(previousTodoQuery);
  //   console.log(previousTodoInfo);
  const {
    todo = previousTodoInfo.todo,
    status = previousTodoInfo.status,
    priority = previousTodoInfo.priority,
  } = request.body;
  const updateTodoQuery = `
        UPDATE todo
        SET todo = '${todo}',
            status = '${status}',
            priority = '${priority}'
        WHERE id = ${todoId};
  `;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// Delete Todo API

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
