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
        connection.query(
            `SELECT * FROM products;`,
            function(err, res) {
                if (err) throw err;
                inquirer.prompt([
                    {
                        message: "Choose a product by ID:",
                        validate:function(id){                            
                            if(!/^[0-9]+$/.test(id)||id<1||id>res.length)
                                return `Please select a number between 1 and ${res.length}.`

                            if(res[id-1].stock_quantity<1)
                                return `${res[id-1].product_name} is out of stock, please select another product.`

                            return true;
                        },
                        name: "productId"
                    }
                ])
                .then(function(response) {
                    bamazon.askProductNumber(response.productId);
                });
            }
        );
    },

    askProductNumber:function(productId){
        connection.query(
            `SELECT * FROM products WHERE id=${productId};`,
            function(err, res) {
                if (err) throw err;
                res = res[0];

                inquirer.prompt([
                    {
                        message: `How many ${res.product_name.endsWith("s")?res.product_name:res.product_name+"s"} do you want?`,
                        validate:function(number){
                            if(number>res.stock_quantity)
                                return `Not enough ${res.product_name.endsWith("s")?res.product_name:res.product_name+"s"} in stock. There are ${res.stock_quantity} in stock currently.`
                            
                            if(!/^[0-9]+$/.test(number)||number<1)
                                return `Please select a number between 1 and ${res.stock_quantity} (current stock).`

                            return true;
                        },
                        name: "productNumber"
                    }
                ])
                .then(function(response) {
                    console.log("\x1b[32m",`\n${response.productNumber} ${res.product_name.endsWith("s")?res.product_name:res.product_name+"s"} bought.\n`+
                                `Your total is $${response.productNumber*res.price}.\n`,"\x1b[0m");
                    bamazon.reduceStock(productId,response.productNumber);
                    bamazon.askBuyAgain();
                });
            }
        );
    },

    showProducts:function(func){
        connection.query(
            `SELECT * FROM products;`,
            function(err, res) {
                process.stdout.write("\u001b[2J\u001b[0;0H");
                console.log(`\n\t    --- WELCOME TO \x1b[1;36mBAMAZON\x1b[0m --- \n`+
                            `\t      --- PRODUCTS TABLE ---`);
                console.log("\x1b[33m",`\n ------------------------------------------------\n`+
                            ` | ID\t| Product\t\t| Price\t| Stock\t|\n`+
                            ` | ---\t| ---------------------\t| -----\t| -----\t|`);
                for(let product of res){
                    console.log(` | ${product.id}\t| ${product.product_name.length<14?product.product_name+"\t":product.product_name}\t| `+
                                `${product.price}\t| ${product.stock_quantity===0?`\x1b[31m${product.stock_quantity}\x1b[33m`:product.stock_quantity}\t|`);
                }
                console.log(` ------------------------------------------------\n`,"\x1b[0m");
                func();
            }
        );
    },

    askBuyAgain:function(){
        inquirer.prompt([
            {
                type:"list",
                choices:["Yes please.","No thanks."],
                message: "Would you like to buy something else?",
                name: "choice"
            }
        ])
        .then(function(response) {
            if(response.choice==="Yes please."){
                bamazon.showProducts(bamazon.askProductId);
            }else{
                process.stdout.write("\u001b[2J\u001b[0;0H");
                console.log("\nThank you for shopping at \x1b[1;36mBAMAZON\x1b[0m, have a nice day!");
                connection.end();
            }
        });
    },

    reduceStock:function(id, sold){
        connection.query(
            `UPDATE products SET stock_quantity = stock_quantity - ${sold} WHERE id = ${id};`,
            function(err, res) {
                if (err) throw err;
            }
        );
    }
}

bamazon.showProducts(bamazon.askProductId);