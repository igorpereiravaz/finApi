const { response, request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

//Middleware
function verifyExistsAccountCpf(request, response, next ){
    const {cpf} = request.headers; 

    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({ error: "customer not found!"});
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type == "credit") {
            return acc + operation.amount;
        } else  {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

// CRUD ACCOUNT

app.post("/account", (request, response) => {

    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer)=>customer.cpf === cpf
    );

    if (customerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"});
    }
    
    customers.push({
        cpf,
        name,
        id : uuidv4(), 
        statement: []
    });

    return response.status(201).send();
});

app.delete("/account", verifyExistsAccountCpf, (request, response) =>{
    const { customer } = request;

    //splice
    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.put("/account", verifyExistsAccountCpf, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyExistsAccountCpf, (request, response) => {
    const { customer }  = request;

    return response.json(customer);
});

// MOVIMENTAçÕES BANCARIAS

app.get("/statement", verifyExistsAccountCpf,  (request, response) => {
 //    app.use(verifyExistsAccountCpf);
    const { customer } = request;
    return response.json(customer.statement);

});

app.get("/statement/date", verifyExistsAccountCpf,  (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
    );

    return response.json(statement);
   
});

app.post("/deposit", verifyExistsAccountCpf,  (request,response) => {

    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at : new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

});

app.get("/balance", verifyExistsAccountCpf, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(balance);
});

app.listen(3333);
