require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database
});

var bamazon = {
    askProductId:function(){
        inquirer.prompt([
            {
                type:"number",
                message: "Choose a product by Id:",
                name: "productId"
            }
        ])
        .then(function(response) {
            bamazon.askProductNumber(response.productId);
        });
    },
    askProductNumber:function(productId){
        inquirer.prompt([
            {
                type:"number",
                message: `How many units do you want:`,
                name: "productNumber"
            }
        ])
        .then(function(response) {

        });
    },
}

bamazon.askProductId();