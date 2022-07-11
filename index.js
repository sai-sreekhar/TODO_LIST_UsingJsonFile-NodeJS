const express = require("express");
const Joi = require("joi");
const fs = require("fs");
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
app.listen(port, (req, res) => {
  console.log(`Listening on port ${port}...`);

  if (!fs.existsSync("./tasks.json")) {
    console.log("Creating file tasks.json");
    const defaultJSON = {
      lastId: 0,
      tasks: {},
      orderById: [],
    };
    fs.writeFileSync("tasks.json", JSON.stringify(defaultJSON));
  }
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/tasks", (req, res) => {
  let tasksList;
  try {
    tasksList = JSON.parse(fs.readFileSync("tasks.json", "utf8"));
  } catch (error) {
    console.log(`Error while Reading File err = ${error}`);
    res.status(404).send("File not found");
    return;
  }

  let result = {};
  result["tasks"] = tasksList["tasks"];
  result["orderById"] = tasksList["orderById"];
  res.send(result);
});

app.post("/api/newTask", (req, res) => {
  const { error } = validateTask(req.body);

  if (error) return res.status(400).send(error["details"][0]["message"]);

  let tasksList;
  try {
    tasksList = JSON.parse(fs.readFileSync("tasks.json", "utf8"));
  } catch (error) {
    console.log(`Error while Reading File err = ${error}`);
    res.status(404);
    return;
  }

  const currTaskId = tasksList["lastId"] + 1;
  tasksList.orderById.push(currTaskId);
  tasksList["lastId"] = currTaskId;

  tasksList["tasks"][currTaskId] = {
    desc: req.body.task,
    isCompleted: false,
  };

  try {
    fs.writeFileSync("tasks.json", JSON.stringify(tasksList));
    res.status(200).end();
  } catch (error) {
    console.log(`Error while writing to file err = ${error}`);
    res.status(500).send("Write file failed");
    return;
  }
});

app.put("/api/updateTask/:id", (req, res) => {
  let tasksList;
  try {
    tasksList = JSON.parse(fs.readFileSync("tasks.json", "utf8"));
  } catch (error) {
    console.log(`Error while Reading File err = ${error}`);
    res.status(404);
    return;
  }

  if (!tasksList["tasks"][req.params.id]) {
    return res.status(404).send("The Task with gievn id isn't found");
  }

  const { error } = validateTask(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  tasksList["tasks"][req.params.id]["desc"] = req.body.task;

  try {
    fs.writeFileSync("tasks.json", JSON.stringify(tasksList));
    res.status(200).end();
  } catch (error) {
    console.log(`Error while writing to file err = ${error}`);
    res.status(500).send("Write file failed");
    return;
  }
});

app.put("/api/completeTask/:id", (req, res) => {
  let tasksList;
  try {
    tasksList = JSON.parse(fs.readFileSync("tasks.json", "utf8"));
  } catch (error) {
    console.log(`Error while Reading File err = ${error}`);
    res.status(404);
    return;
  }

  if (!tasksList["tasks"][req.params.id]) {
    return res.status(404).send("The Task with gievn id isn't found");
  }

  tasksList["tasks"][req.params.id]["isCompleted"] = true;

  try {
    fs.writeFileSync("tasks.json", JSON.stringify(tasksList));
    res.status(200).end();
  } catch (error) {
    console.log(`Error while writing to file err = ${error}`);
    res.status(500).send("Write file failed");
    return;
  }
});

app.delete("/api/deleteTask/:id", (req, res) => {
  let tasksList;
  try {
    tasksList = JSON.parse(fs.readFileSync("tasks.json", "utf8"));
  } catch (error) {
    console.log(`Error while Reading File err = ${error}`);
    res.status(404);
    return;
  }

  if (!tasksList["tasks"][req.params.id]) {
    return res.status(404).send("The Task with gievn id isn't found");
  }

  delete tasksList["tasks"][req.params.id];
  const idxToDel = tasksList["orderById"].indexOf(parseInt(req.params.id));
  tasksList["orderById"].splice(idxToDel, 1);

  try {
    fs.writeFileSync("tasks.json", JSON.stringify(tasksList));
    res.status(200).end();
  } catch (error) {
    console.log(`Error while writing to file err = ${error}`);
    res.status(500).send("Write file failed");
    return;
  }
});

function validateTask(task) {
  const schema = Joi.object({
    task: Joi.string().required(),
  });

  return schema.validate(task);
}
