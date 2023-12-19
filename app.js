const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";
  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
          * 
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}'
          AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%';`;
  }

  const getTodos = await db.all(getTodosQuery);
  response.send(getTodos);
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const specificTodoQuery = `
    SELECT 
    *
    FROM 
    todo
    WHERE
    todo.id = ${todoId};`;
  const specificTodo = await db.get(specificTodoQuery);
  response.send(specificTodo);
});

//create a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
  INSERT INTO
  todo (id, todo, priority, status)
  VALUES (
      ${id},
      '${todo}',
      '${priority}',
      '${status}'
  );`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//update specific todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateProperty = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateProperty = "Status";
      break;
    case requestBody.priority !== undefined:
      updateProperty = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateProperty = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    todo.id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
  UPDATE 
    todo
  SET
    todo='${todo}',
    priority='${priority}',
    status='${status}'
  WHERE
    todo.id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateProperty} Updated`);
});

//delete a todo based on todo id
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  DeleteQuery = `
  DELETE FROM 
  todo
  WHERE
  todo.id = ${todoId};`;
  await db.run(DeleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
